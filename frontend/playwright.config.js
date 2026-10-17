const {defineConfig}=require('@playwright/test');
const baseURL=process.env.E2E_BASE_URL||'http://127.0.0.1:4300';
if(!['127.0.0.1','localhost'].includes(new URL(baseURL).hostname)||new URL(baseURL).protocol!=='http:')throw Error('Browser verification requires loopback HTTP');
module.exports=defineConfig({testDir:'./e2e',fullyParallel:false,workers:1,retries:0,forbidOnly:!!process.env.CI,timeout:45000,
 expect:{timeout:10000},reporter:[['list'],['html',{open:'never'}]],
 globalSetup:require.resolve('./e2e/global-setup'),globalTeardown:require.resolve('./e2e/global-teardown'),
 use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',reducedMotion:'reduce'},
 projects:[{name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},{name:'mobile',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]});
