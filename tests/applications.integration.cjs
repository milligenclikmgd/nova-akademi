const assert=require('node:assert/strict');
const base=process.env.NOVA_TEST_URL||'http://127.0.0.1:8787';if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Tests must use a local isolated server');let cookie='';
const testIp='192.0.2.'+(20+Math.floor(Math.random()*200));
async function request(path,method='GET',data,auth=false,origin=base){const headers={Origin:origin,'CF-Connecting-IP':testIp};if(auth)headers.Cookie=cookie;if(data&&!(data instanceof FormData))headers['Content-Type']='application/json';return fetch(base+path,{method,headers,body:data instanceof FormData?data:data?JSON.stringify(data):undefined})}
async function json(path,method,data,auth,status=200){const res=await request(path,method,data,auth);const value=await res.json();assert.equal(res.status,status,JSON.stringify(value));return value}
function candidate(){return {firstName:'Deneme',lastName:'Aday',dob:'2012-04-12',tc:'',passport:'',nationality:'Türkiye',gender:'',phone:'',email:'',province:'Ankara',district:'Çankaya',address:'Yerel test adresi, gerçek kişi değildir.',school:'Deneme Okulu',grade:'8'}}
function form(settings,extra={}){return {requestId:crypto.randomUUID(),revision:settings.revision,city:'ankara',group:'sanat',branch:'dans-sahne',feeType:'candidate',candidate:candidate(),familyMode:'guardian',contacts:[{role:'guardian',fullName:'Deneme Veli',relationship:'Vasi',occupation:'Öğretmen',phone:'05000000000',email:''}],primaryContact:'guardian',paid:false,confirmation:true,...extra}}
function body(data,file){const result=new FormData();result.set('data',JSON.stringify(data));if(file)result.set('receipt',file,'dekont.pdf');return result}
(async()=>{
 await json('/api/panel/applications','GET',undefined,false,401);
 assert.equal((await request('/api/panel/login','POST',{password:'x'},false,'https://wrong.example')).status,403);
 await json('/api/panel/login','POST',{password:'incorrect'},false,401);
 let response=await request('/api/panel/login','POST',{password:'nova-local-integration-only-2026'});assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly; Secure; SameSite=Strict/);cookie=setCookie.split(';')[0];
 const initialCount=(await json('/api/panel/applications','GET',undefined,true)).total; console.log('Existing persisted applications: '+initialCount);
 let settings=(await json('/api/panel/settings','GET',undefined,true)).settings;
 settings.accepting=true;settings.paymentInstructions='Yerel test ödeme açıklaması';for(const group of settings.groups)for(const branch of group.branches){branch.candidateFee=150.5;branch.registrationFee=1200}
 let saved=(await json('/api/panel/settings','PUT',settings,true)).settings;
 await json('/api/panel/settings','PUT',settings,true,409);settings=saved;
 const invalid=form(settings);invalid.candidate.firstName='';await json('/api/applications','POST',body(invalid),false,400);
 const badDate=form(settings);badDate.candidate.dob='2012-02-31';await json('/api/applications','POST',body(badDate),false,400);
 const unpaid=form(settings,{fee:1}),one=await json('/api/applications','POST',body(unpaid),false,201);assert.equal((await json('/api/applications','POST',body(unpaid),false)).id,one.id);
 await json('/api/applications','POST',body(form(settings,{paid:true})),false,400);
 await json('/api/applications','POST',body(form(settings,{paid:true}),new Blob(['not a pdf'],{type:'application/pdf'})),false,400);
 await json('/api/applications','POST',body(form(settings,{paid:true}),new Blob([new Uint8Array(5*1024*1024+1)])),false,400);
 const pdf=new Blob(['%PDF-1.4\n% local test only\n%%EOF'],{type:'application/pdf'}),paid=form(settings,{group:'spor',branch:'futsal',feeType:'registration',paid:true});
 const two=await json('/api/applications','POST',body(paid,pdf),false,201);
 await json('/api/applications','POST',body(form(settings,{branch:'invalid'})),false,400);
 await json('/api/applications','POST',body(form(settings,{revision:0})),false,409);
 const item=(await json('/api/panel/applications/'+one.id,'GET',undefined,true)).application;assert.equal(item.fee,150.5);assert.equal(item.contacts[0].relationship,'Vasi');
 const detail=(await json('/api/panel/applications/'+two.id,'GET',undefined,true)).application;assert.equal(detail.fee,1200);assert.equal(detail.payment,'beyan-edildi');assert.equal(detail.receipt,true);
 assert.equal((await request('/api/panel/applications/'+two.id+'/receipt')).status,401);
 response=await request('/api/panel/applications/'+two.id+'/receipt','GET',undefined,true);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),Buffer.from(await pdf.arrayBuffer()));assert.match(response.headers.get('content-disposition'),/attachment/);
 await json('/api/panel/applications/'+two.id,'PATCH',{status:'inceleniyor',payment:'dogrulandi',note:'Yerel kontrolde doğrulandı.'},true);
 assert.equal((await json('/api/panel/applications/'+two.id,'GET',undefined,true)).application.payment,'dogrulandi');
 settings.groups[0].branches[0].candidateFee=175;settings=(await json('/api/panel/settings','PUT',settings,true)).settings;
 assert.equal((await json('/api/panel/applications/'+one.id,'GET',undefined,true)).application.fee,150.5);
 const list=await json('/api/panel/applications','GET',undefined,true);assert.ok(list.total>=2);assert.ok(!('candidate' in list.applications[0]));
 assert.equal((await json('/api/panel/applications?q='+encodeURIComponent("' OR 1=1 --"),'GET',undefined,true)).total,0);
 await json('/api/panel/logout','POST',{},true);await json('/api/panel/session','GET',undefined,true,401);
 for(let attempt=0;attempt<3;attempt++)await json('/api/panel/login','POST',{password:'incorrect'},false,401);
 await json('/api/panel/login','POST',{password:'incorrect'},false,429);
 console.log(JSON.stringify({passed:true,checks:['authentication','origin protection','server validation','idempotency','candidate and registration fees','guardian','PDF validation and download','payment verification','price snapshots','settings revision','SQL parameters','logout'],testApplications:[one.id,two.id]}));
})().catch(error=>{console.error(error);process.exitCode=1});
