const { check }=require('../../scripts/check-build-config.cjs');
test('release builds reject missing verification, fake mode and API credentials',()=>{
 for(const env of [{},{REACT_APP_TURNSTILE_MODE:'fake',REACT_APP_TURNSTILE_SITE_KEY:'test'},{REACT_APP_TURNSTILE_MODE:'live',REACT_APP_TURNSTILE_SITE_KEY:'test',REACT_APP_BACKEND_URL:'https://user:secret@example.test'}])expect(()=>check(env)).toThrow();
});
test('explicit local release uses live widget with controlled test fixture',()=>{
 expect(check({BUILD_TARGET:'local',REACT_APP_TURNSTILE_MODE:'live',REACT_APP_TURNSTILE_SITE_KEY:'local-test-site-key',REACT_APP_BACKEND_URL:'http://127.0.0.1:8300'})).toBe('local');
});
test('production is blocked while business identity, privacy and retention are unresolved',()=>{
 expect(()=>check({REACT_APP_TURNSTILE_MODE:'live',REACT_APP_TURNSTILE_SITE_KEY:'real-public-key',REACT_APP_BACKEND_URL:'https://api.example.test'})).toThrow();
});
