const {test:base,expect}=require('@playwright/test');
const fs=require('fs');const path=require('path');const {execFileSync}=require('child_process');const crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const python=process.env.PYTHON_BIN||[path.join(root,'backend/.venv-intake/bin/python'),path.join(root,'backend/.venv/bin/python')].find(fs.existsSync);
if(!python)throw Error('Install backend development requirements in a virtual environment');
const state=()=>JSON.parse(fs.readFileSync(path.join(root,'.local/test/state.json'),'utf8'));
function db(action,value=''){return JSON.parse(execFileSync(python,[path.join(root,'backend/tests/support/browser_db.py'),action,value],{encoding:'utf8'}));}
function captures(){const file=path.join(state().directory,'captures.jsonl');return fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];}
const syntheticEmail=()=>`browser-${crypto.randomUUID()}@example.test`;
const test=base.extend({page:async({page},use)=>{
 // This is a local widget fixture, never used against production or genuine challenges.
 await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',route=>route.fulfill({contentType:'application/javascript',body:`window.turnstile={widgets:new Map(),render(node,options){const id=crypto.randomUUID();this.widgets.set(id,options);queueMicrotask(()=>options.callback('local-browser-fixture-'+id));return id;},reset(id){const options=this.widgets.get(id);if(options)queueMicrotask(()=>options.callback('local-browser-fixture-'+crypto.randomUUID()));},remove(id){this.widgets.delete(id);}};`}));
 await use(page);
}});
module.exports={test,expect,root,python,state,db,captures,syntheticEmail};
