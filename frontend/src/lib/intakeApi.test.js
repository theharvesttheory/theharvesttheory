import { submitEnquiry, requestNewsletter, confirmNewsletter, unsubscribeNewsletter, requestIdentity, apiOrigin } from './intakeApi';
const body={type:'general',fields:{email:'test@example.test',name:'Test',message:'Synthetic'},privacy_notice_version:'2026-10-17',source_path:'/contact',website:'',turnstile_token:'test'};
const receipt={status:'received',id:'b769038c-d26a-4aa6-b8bf-23d818089e43'};
const response=(status,data)=>({status,ok:status>=200&&status<300,json:async()=>data,headers:{get:()=>null}});
beforeEach(()=>{global.fetch=jest.fn();process.env.REACT_APP_BACKEND_URL='http://127.0.0.1:8300/';});
afterEach(()=>jest.useRealTimers());
test('joins origin, omits credentials and sends the caller key',async()=>{
 fetch.mockResolvedValue(response(201,receipt));
 expect(await submitEnquiry({body,idempotencyKey:'test-key'})).toEqual(receipt);
 expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8300/api/enquiries',expect.objectContaining({method:'POST',credentials:'omit',headers:expect.objectContaining({'Idempotency-Key':'test-key'}),body:JSON.stringify(body)}));
});
test.each([422,409,429,503])('safe error for %s and no automatic retry',async status=>{
 fetch.mockResolvedValue(response(status,{error:{message:'UNTRUSTED DETAIL',fields:[{field:'email',message:'Please enter a valid email address.'}]}}));
 await expect(submitEnquiry({body,idempotencyKey:'key'})).rejects.toMatchObject({status,fields:['email']});expect(fetch).toHaveBeenCalledTimes(1);
});
test('malformed 2xx and non JSON errors never show receipt',async()=>{
 fetch.mockResolvedValue(response(200,{status:'received'}));await expect(submitEnquiry({body})).rejects.toThrow();
 fetch.mockResolvedValue({status:503,ok:false,json:async()=>{throw Error('HTML SECRET');},headers:{get:()=>null}});
 await expect(submitEnquiry({body})).rejects.not.toThrow('HTML SECRET');
});
test('timeout allows a cold start but aborts at 90 seconds; navigation still aborts',async()=>{
 jest.useFakeTimers();fetch.mockImplementation((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));
 const pending=submitEnquiry({body});const assertion=expect(pending).rejects.toMatchObject({code:'timeout'});
 jest.advanceTimersByTime(60000);
 expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
 jest.advanceTimersByTime(30000);await assertion;
 const controller=new AbortController();const next=submitEnquiry({body,signal:controller.signal});const aborted=expect(next).rejects.toMatchObject({name:'AbortError'});controller.abort();await aborted;
});
test('a submission can finish after a 60 second cold start without reposting',async()=>{
 jest.useFakeTimers();
 fetch.mockImplementation((url,{signal})=>new Promise((resolve,reject)=>{
  signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));
  setTimeout(()=>resolve(response(201,receipt)),60000);
 }));
 const pending=submitEnquiry({body,idempotencyKey:'cold-start-key'});
 const assertion=expect(pending).resolves.toEqual(receipt);
 jest.advanceTimersByTime(60000);await assertion;
 expect(fetch).toHaveBeenCalledTimes(1);
});
test('business snapshot reuses retry key despite changed challenge; edits replace it',()=>{
 const first=requestIdentity(null,body);
 expect(requestIdentity(first,{...body,turnstile_token:'new'}).key).toBe(first.key);
 expect(requestIdentity(first,{...body,fields:{...body.fields,name:'Changed'}}).key).not.toBe(first.key);
 expect(requestIdentity(null,body).key).not.toBe(first.key);
});
test('production requires configured origin',()=>{expect(()=>apiOrigin('', 'production')).toThrow();expect(()=>apiOrigin('https://example.test/path','production')).toThrow();});
test('newsletter requires correct receipt and membership actions post token in body',async()=>{
 fetch.mockResolvedValue(response(202,{status:'requested'}));expect(await requestNewsletter({body})).toEqual({status:'requested'});
 fetch.mockResolvedValue(response(200,{status:'subscribed'}));await confirmNewsletter({token:'private'});
 expect(fetch).toHaveBeenLastCalledWith('http://127.0.0.1:8300/api/newsletter/confirm',expect.objectContaining({body:'{"token":"private"}'}));
 fetch.mockResolvedValue(response(200,{status:'unsubscribed'}));await unsubscribeNewsletter({token:'private'});
 fetch.mockResolvedValue(response(200,{status:'requested'}));await expect(requestNewsletter({body})).rejects.toThrow();
});
