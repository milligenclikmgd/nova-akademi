const assert=require('node:assert/strict');
const base=process.env.NOVA_TEST_URL||'http://127.0.0.1:8787';if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Tests must use a local isolated server');let cookie='';
const testIp='192.0.2.'+(20+Math.floor(Math.random()*200));
async function request(path,method='GET',data,auth=false,origin=base){const headers={Origin:origin,'CF-Connecting-IP':testIp};if(auth)headers.Cookie=cookie;if(data&&!(data instanceof FormData))headers['Content-Type']='application/json';return fetch(base+path,{method,headers,body:data instanceof FormData?data:data?JSON.stringify(data):undefined})}
async function json(path,method,data,auth,status=200){const res=await request(path,method,data,auth);const value=await res.json();assert.equal(res.status,status,JSON.stringify(value));return value}
function candidate(){return {firstName:'Deneme',lastName:'Aday',dob:'2012-04-12',tc:'10000000146',gender:'',phone:'05555555555',email:'',province:'Ankara',district:'Çankaya',address:'Yerel test adresi, gerçek kişi değildir.',school:'DENEME OKULU',grade:'8'}}
function form(settings,extra={}){return {requestId:crypto.randomUUID(),revision:settings.revision,city:'ankara',group:'sanat',branch:'dans-sahne',feeType:'candidate',candidate:candidate(),familyMode:'guardian',contacts:[{role:'guardian',fullName:'Deneme Veli',relationship:'Vasi',occupation:'ÖĞRETMEN',phone:'05000000000',email:''}],primaryContact:'guardian',paid:false,contractAccepted:true,confirmation:true,...extra}}
function body(data,file){const result=new FormData();result.set('data',JSON.stringify(data));if(file)result.set('receipt',file,'dekont.pdf');return result}
(async()=>{
 await json('/api/panel/applications','GET',undefined,false,401);
 assert.equal((await request('/api/panel/login','POST',{password:'x'},false,'https://wrong.example')).status,403);
 await json('/api/panel/login','POST',{password:'incorrect'},false,401);
 let response=await request('/api/panel/login','POST',{password:'nova-local-integration-only-2026'});assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly; Secure; SameSite=Strict/);cookie=setCookie.split(';')[0];
 const initialCount=(await json('/api/panel/applications','GET',undefined,true)).total; console.log('Existing persisted applications: '+initialCount);
 let settings=(await json('/api/panel/settings','GET',undefined,true)).settings;
 settings.accepting=true;settings.paymentInstructions='Yerel test ödeme açıklaması';settings.applicationContract='Yerel test sözleşmesi';settings.cityExams={ankara:['dans-sahne','futsal'],istanbul:['dans-sahne'],manisa:['dans-sahne']};for(const group of settings.groups)for(const branch of group.branches){branch.candidateFee=150.5;branch.registrationFee=null}settings.groups[0].branches[0].paymentInstructions='Dans için IBAN ve ödeme bilgisi';settings.groups[0].branches[0].applicationContract='Dans başvurusu sözleşmesi';settings.groups[0].branches[1].paymentInstructions='Senfoni için farklı IBAN';settings.groups[0].branches[1].applicationContract='Senfoni başvurusu sözleşmesi'
 let saved=(await json('/api/panel/settings','PUT',settings,true)).settings;
 assert.equal(saved.groups[0].branches[0].paymentInstructions,'Dans için IBAN ve ödeme bilgisi');assert.equal(saved.groups[0].branches[1].paymentInstructions,'Senfoni için farklı IBAN');assert.equal(saved.groups[0].branches[0].applicationContract,'Dans başvurusu sözleşmesi');assert.equal(saved.groups[0].branches[1].applicationContract,'Senfoni başvurusu sözleşmesi');
 const publicSettings=(await json('/api/applications/config')).settings;assert.equal(publicSettings.groups[0].branches[0].paymentInstructions,'Dans için IBAN ve ödeme bilgisi');assert.equal(publicSettings.groups[0].branches[1].paymentInstructions,'Senfoni için farklı IBAN');assert.equal(publicSettings.groups[0].branches[0].applicationContract,'Dans başvurusu sözleşmesi');assert.equal(publicSettings.groups[0].branches[1].applicationContract,'Senfoni başvurusu sözleşmesi');
 await json('/api/panel/settings','PUT',settings,true,409);settings=saved;
 const invalid=form(settings);invalid.candidate.firstName='';await json('/api/applications','POST',body(invalid),false,400);
 const invalidTc=form(settings);invalidTc.candidate.tc='10000000147';await json('/api/applications','POST',body(invalidTc),false,400);
 const noTc=form(settings);noTc.candidate.tc='';await json('/api/applications','POST',body(noTc),false,400);
 const badEmail=form(settings);badEmail.candidate.email='not-an-email';await json('/api/applications','POST',body(badEmail),false,400);
 const noGuardianPhone=form(settings);noGuardianPhone.contacts[0].phone='';await json('/api/applications','POST',body(noGuardianPhone),false,400);
 const missingContract=form(settings);missingContract.contractAccepted=false;await json('/api/applications','POST',body(missingContract),false,400);
 const wrongDistrict=form(settings);wrongDistrict.candidate.district='Kadıköy';await json('/api/applications','POST',body(wrongDistrict),false,400);
 const badDate=form(settings);badDate.candidate.dob='2012-02-31';await json('/api/applications','POST',body(badDate),false,400);
 const unpaid=form(settings,{fee:1}),one=await json('/api/applications','POST',body(unpaid),false,201);assert.match(one.reference,/^01-ANK-\d{3,}$/);assert.equal((await json('/api/applications','POST',body(unpaid),false)).reference,one.reference);
 const tracked=await json('/api/applications/track?reference='+one.reference);assert.equal(tracked.status,'kontrol-ediliyor');assert.equal(tracked.branch,'Dans ve Sahne Sanatları Sınavı');assert.ok(!('candidate' in tracked));assert.equal((await json('/api/applications/track?reference=01-ANK-999')).found,false);
 const istanbul=await json('/api/applications','POST',body(form(settings,{city:'istanbul',candidate:{...candidate(),province:'İstanbul',district:'Kadıköy'}})),false,201);assert.match(istanbul.reference,/^01-IST-\d{3,}$/);
 const manisa=await json('/api/applications','POST',body(form(settings,{city:'manisa',candidate:{...candidate(),province:'Manisa',district:'Şehzadeler'}})),false,201);assert.match(manisa.reference,/^01-MAN-\d{3,}$/);
 await json('/api/applications','POST',body(form(settings,{paid:true})),false,400);
 await json('/api/applications','POST',body(form(settings,{paid:true}),new Blob(['not a pdf'],{type:'application/pdf'})),false,400);
 await json('/api/applications','POST',body(form(settings,{paid:true}),new Blob([new Uint8Array(5*1024*1024+1)])),false,400);
 const pdf=new Blob(['%PDF-1.4\n% local test only\n%%EOF'],{type:'application/pdf'}),paid=form(settings,{group:'spor',branch:'futsal',paid:true});
 const two=await json('/api/applications','POST',body(paid,pdf),false,201);
 await json('/api/applications','POST',body(form(settings,{branch:'invalid'})),false,400);
 await json('/api/applications','POST',body(form(settings,{revision:0})),false,409);
 const item=(await json('/api/panel/applications/'+one.id,'GET',undefined,true)).application;assert.equal(item.fee,150.5);assert.equal(item.contacts[0].relationship,'Vasi');
 const detail=(await json('/api/panel/applications/'+two.id,'GET',undefined,true)).application;assert.equal(detail.fee,1200);assert.equal(detail.payment,'beyan-edildi');assert.equal(detail.receipt,true);
 assert.equal((await request('/api/panel/applications/'+two.id+'/receipt')).status,401);
 response=await request('/api/panel/applications/'+two.id+'/receipt','GET',undefined,true);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),Buffer.from(await pdf.arrayBuffer()));assert.match(response.headers.get('content-disposition'),/attachment/);
 await json('/api/panel/applications/'+two.id,'PATCH',{status:'onaylandi',payment:'dogrulandi',note:'Yerel kontrolde doğrulandı.'},true);
 assert.equal((await json('/api/panel/applications/'+two.id,'GET',undefined,true)).application.payment,'dogrulandi');
 assert.equal((await json('/api/applications/track?reference='+two.reference)).status,'onaylandi');
 await json('/api/panel/applications/'+one.id,'PATCH',{status:'reddedildi',payment:'odenmedi',note:'Yerel test reddi.',rejectionExplanation:'Yerel test açıklaması.'},true);
 const rejectedTrack=await json('/api/applications/track?reference='+one.reference);assert.equal(rejectedTrack.status,'reddedildi');assert.equal(rejectedTrack.rejectionExplanation,'Yerel test açıklaması.');
 await json('/api/panel/applications/'+two.id,'PATCH',{status:'reddedildi',payment:'dogrulandi',note:'',rejectionExplanation:''},true,400);
 settings.groups[0].branches[0].candidateFee=175;settings=(await json('/api/panel/settings','PUT',settings,true)).settings;
 assert.equal((await json('/api/panel/applications/'+one.id,'GET',undefined,true)).application.fee,150.5);
 const list=await json('/api/panel/applications','GET',undefined,true);assert.ok(list.total>=2);assert.ok(!('candidate' in list.applications[0]));
 assert.equal((await json('/api/panel/settings','GET',undefined,true)).settings.applicationContract,'Yerel test sözleşmesi');
 assert.equal((await json('/api/panel/applications?branch=dans-sahne','GET',undefined,true)).total,list.total-1);
 const exportResponse=await request('/api/panel/applications?export=xlsx','GET',undefined,true);assert.equal(exportResponse.status,200);assert.match(exportResponse.headers.get('content-type'),/spreadsheetml/);assert.match(exportResponse.headers.get('content-disposition'),/nova-basvurular\.xlsx/);assert.deepEqual(Buffer.from(new Uint8Array(await exportResponse.arrayBuffer()).slice(0,4)),Buffer.from([0x50,0x4b,0x03,0x04]));
 assert.equal((await json('/api/panel/applications?q='+encodeURIComponent("' OR 1=1 --"),'GET',undefined,true)).total,0);
 const cors=await request('/api/applications/config','GET',undefined,false,'https://nova-akademi.vercel.app');assert.equal(cors.headers.get('access-control-allow-origin'),'https://nova-akademi.vercel.app');assert.equal(cors.headers.get('access-control-allow-credentials'),null);
 const trackCors=await request('/api/applications/track?reference=01-ANK-999','GET',undefined,false,'https://nova-akademi.vercel.app');assert.equal(trackCors.headers.get('access-control-allow-origin'),'https://nova-akademi.vercel.app');
 assert.equal((await request('/api/applications','OPTIONS',undefined,false,'https://nova-akademi.vercel.app')).status,204);
 assert.equal((await request('/api/panel/login','OPTIONS',undefined,false,'https://nova-akademi.vercel.app')).status,403);
 assert.equal((await request('/api/panel/settings','PUT',settings,true,'https://nova-akademi.vercel.app')).status,403);
 const crossApplication=await request('/api/applications','POST',body(form(settings)),false,'https://nova-akademi.vercel.app');assert.equal(crossApplication.status,201);assert.equal(crossApplication.headers.get('access-control-allow-origin'),'https://nova-akademi.vercel.app');
 await json('/api/panel/logout','POST',{},true);await json('/api/panel/session','GET',undefined,true,401);
 for(let attempt=0;attempt<3;attempt++)await json('/api/panel/login','POST',{password:'incorrect'},false,401);
 await json('/api/panel/login','POST',{password:'incorrect'},false,429);
 console.log(JSON.stringify({passed:true,checks:['authentication','origin protection','server validation','idempotency','candidate and registration fees','guardian','PDF validation and download','payment verification','price snapshots','settings revision','SQL parameters','logout'],testApplications:[one.id,two.id]}));
})().catch(error=>{console.error(error);process.exitCode=1});
