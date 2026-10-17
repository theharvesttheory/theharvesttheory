function check(env, launch=require('../src/data/launch-config.json')) {
  const target=env.BUILD_TARGET||'production';
  if(!['local','production'].includes(target))throw Error('Unknown BUILD_TARGET');
  if(env.REACT_APP_TURNSTILE_MODE!=='live'||!env.REACT_APP_TURNSTILE_SITE_KEY)throw Error('Release builds require live widget mode and a public site key');
  if(!env.REACT_APP_BACKEND_URL)throw Error('A public API origin is required');
  const url=new URL(env.REACT_APP_BACKEND_URL);
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!['http:','https:'].includes(url.protocol))throw Error('Invalid public API origin');
  if(target==='production'&&(url.protocol!=='https:'||['localhost','127.0.0.1','::1'].includes(url.hostname)))throw Error('Production requires an HTTPS API origin');
  if(target==='local'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('Local release verification requires a loopback API');
  if(target==='production'){
    if(!launch.businessApproved||!launch.privacyApproved||!launch.retentionApproved)throw Error('Business, privacy and retention approval required');
    for(const name of ['ownerName','ownerAddress','privacyEmail','supportEmail','suppressionPolicy']){
      if(typeof launch[name]!=='string'||!launch[name].trim()||/pending|placeholder|example\.|changeme/i.test(launch[name]))throw Error(`Unresolved launch setting: ${name}`);
    }
  }
  return target;
}
module.exports={check};
if(require.main===module){
  require('dotenv').config();
  try{console.log(`Frontend configuration valid for ${check(process.env)} build`);}
  catch(error){console.error(error.message);process.exitCode=1;}
}
