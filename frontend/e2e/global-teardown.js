const {execFileSync}=require('child_process');const fs=require('fs');const path=require('path');const {root,python,state}=require('./support');
module.exports=async()=>{
 if(process.env.E2E_REUSE_OWNED==='1')return;
 const owner=path.join(root,'.local/test/playwright-owner.json');if(!fs.existsSync(owner))return;
 if(JSON.parse(fs.readFileSync(owner)).token!==state().token)throw Error('Stack ownership changed; refusing shutdown');
 execFileSync(python,[path.join(root,'scripts/run-local.py'),'stop','--profile','test'],{cwd:root,stdio:'pipe',timeout:25000});fs.unlinkSync(owner);
};
