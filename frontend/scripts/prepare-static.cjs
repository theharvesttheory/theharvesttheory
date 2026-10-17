const fs=require('fs');const path=require('path');
require('dotenv').config();
const {check}=require('./check-build-config.cjs');check(process.env);
const origin=new URL(process.env.REACT_APP_BACKEND_URL).origin;
const headers=fs.readFileSync(path.join(__dirname,'../public/_headers'),'utf8').replaceAll('__PUBLIC_API_ORIGIN__',origin);
fs.writeFileSync(path.join(__dirname,'../build/_headers'),headers);
console.log('Prepared environment-specific static headers');
