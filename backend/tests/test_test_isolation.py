import pytest

@pytest.mark.asyncio
async def test_one_database_can_insert_unique_key(mongo_db):
    await mongo_db.records.create_index('key', unique=True)
    await mongo_db.records.insert_one({'key':'same'})
    assert await mongo_db.records.count_documents({}) == 1

@pytest.mark.asyncio
async def test_another_database_can_insert_same_unique_key(mongo_db):
    await mongo_db.records.create_index('key', unique=True)
    await mongo_db.records.insert_one({'key':'same'})
    assert await mongo_db.records.count_documents({}) == 1

@pytest.mark.parametrize('url', ['mongodb+srv://cloud.example.test',
    'mongodb://127.0.0.1,cloud.example.test:27017', 'mongodb://user:pass@127.0.0.1:27017'])
def test_test_database_server_rejects_remote_or_authenticated_urls(url):
    from conftest import validate_test_mongo_url
    with pytest.raises(ValueError):
        validate_test_mongo_url(url)
