const {execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
const {root,python,state}=require('./support');
module.exports=async()=>{
 if(process.env.E2E_REUSE_OWNED==='1'){
  const current=state();if(current.status!=='running'||!current.database.startsWith('tht_local_test_'))throw Error('No owned test stack to reuse');return;
 }
 execFileSync(python,[path.join(root,'scripts/run-local.py'),'start','--profile','test','--frontend-mode',process.env.E2E_FRONTEND_MODE||'dev'],{cwd:root,stdio:'pipe',timeout:100000});
 fs.writeFileSync(path.join(root,'.local/test/playwright-owner.json'),JSON.stringify({token:state().token}));
};
