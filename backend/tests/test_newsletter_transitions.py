import asyncio
from datetime import timedelta
import pytest
from test_newsletter_requests import service,signup

async def pending(svc,repo):
    await svc.request_signup(signup())
    return await repo.db.newsletter_subscribers.find_one({})

def token(doc,settings,purpose='confirm'):
    from newsletter_tokens import create_action_token
    return create_action_token(doc,purpose,settings)

@pytest.mark.asyncio
async def test_confirmation_is_atomic_and_repetition_does_not_enqueue_again(settings,clock):
    svc,repo=await service(settings,clock)
    try:
        doc=await pending(svc,repo);link=token(doc,settings)
        assert await svc.confirm(link)=={'status':'subscribed'}
        first=await repo.db.newsletter_subscribers.find_one({})
        assert first['confirmed_at']==clock()
        assert set(first['jobs'])=={'confirmation_email','ops_email','slack'}
        assert await svc.confirm(link)=={'status':'subscribed'}
        assert await repo.db.newsletter_subscribers.find_one({})==first
    finally:await repo.close()

@pytest.mark.asyncio
async def test_unsubscribe_cancels_confirmation_and_cannot_be_undone_by_stale_link(settings,clock):
    from errors import APIError
    svc,repo=await service(settings,clock)
    try:
        doc=await pending(svc,repo)
        link=token(doc,settings,'unsubscribe')
        assert await svc.unsubscribe(link)=={'status':'unsubscribed'}
        assert await svc.unsubscribe(link)=={'status':'unsubscribed'}
        after=await repo.db.newsletter_subscribers.find_one({})
        assert after['jobs']['confirmation_email']['state']=='cancelled'
        with pytest.raises(APIError):await svc.confirm(token(doc,settings))
        await svc.request_signup(signup())
        with pytest.raises(APIError):await svc.unsubscribe(link)
        assert (await repo.db.newsletter_subscribers.find_one({}))['state']=='pending'
    finally:await repo.close()

@pytest.mark.asyncio
async def test_concurrent_confirm_and_unsubscribe_finish_unsubscribed(settings,clock):
    from errors import APIError
    svc,repo=await service(settings,clock)
    try:
        doc=await pending(svc,repo)
        results=await asyncio.gather(svc.confirm(token(doc,settings)),
            svc.unsubscribe(token(doc,settings,'unsubscribe')),return_exceptions=True)
        assert all(isinstance(r,(dict,APIError)) for r in results)
        assert (await repo.db.newsletter_subscribers.find_one({}))['state']=='unsubscribed'
    finally:await repo.close()

@pytest.mark.asyncio
async def test_expired_or_wrong_generation_link_cannot_change_state(settings,clock):
    from errors import APIError
    svc,repo=await service(settings,clock)
    try:
        doc=await pending(svc,repo);link=token(doc,settings)
        clock.advance(601);await svc.request_signup(signup())
        with pytest.raises(APIError):await svc.confirm(link)
        current=await repo.db.newsletter_subscribers.find_one({})
        fresh=token(current,settings);clock.advance(86400)
        with pytest.raises(APIError):await svc.confirm(fresh)
        assert (await repo.db.newsletter_subscribers.find_one({}))['state']=='pending'
    finally:await repo.close()

@pytest.mark.asyncio
async def test_concurrent_confirmation_emits_one_job_set(settings,clock):
    svc,repo=await service(settings,clock)
    try:
        doc=await pending(svc,repo)
        results=await asyncio.gather(*(svc.confirm(token(doc,settings)) for _ in range(10)))
        assert all(r=={'status':'subscribed'} for r in results)
        after=await repo.db.newsletter_subscribers.find_one({})
        assert len(after['jobs'])==3 and after['job_history']==[]
    finally:await repo.close()
