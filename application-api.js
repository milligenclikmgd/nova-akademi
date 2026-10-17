const MAX_PDF = 5 * 1024 * 1024;
const COOKIE = '__Host-nova-panel';
export const defaultSettings = () => ({
  revision: 1, accepting: false, paymentInstructions: '',
  groups: [
    {id:'sanat',name:'Sahne Sanatları ve Senfoni Orkestrası',branches:[{id:'dans-sahne',name:'Dans ve Sahne Sanatları Sınavı',candidateFee:null,registrationFee:null},{id:'senfoni',name:'Senfoni Orkestrası Sınavı',candidateFee:null,registrationFee:null}]},
    {id:'spor',name:'Spor Akademisi',branches:[{id:'basketbol',name:'Basketbol Sınavı',candidateFee:null,registrationFee:null},{id:'voleybol',name:'Voleybol Sınavı',candidateFee:null,registrationFee:null},{id:'futbol',name:'Futbol Sınavı',candidateFee:null,registrationFee:null},{id:'futsal',name:'Futsal Sınavı',candidateFee:null,registrationFee:null}]}
  ], cities:[{id:'ankara',name:'Ankara'},{id:'istanbul',name:'İstanbul'},{id:'izmir',name:'İzmir'},{id:'kayseri',name:'Kayseri'},{id:'antalya',name:'Antalya'}]
});
export function reply(data,status=200,headers={}) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const text=(value,max=200)=>{if(typeof value!=='string'||value.length>max)fail('Geçersiz veya çok uzun bilgi.');return value.trim()};
const required=(value,label,max=200)=>{const result=text(value,max);if(!result)fail(label+' gerekli.');return result};
const phone=(value,label,optional=false)=>{const result=text(value,30);if(optional&&!result)return '';if(!/^\+?[\d\s()\-]{10,25}$/.test(result))fail(label+' geçerli olmalı.');return result};
const email=value=>{const result=text(value,150);if(result&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))fail('E-posta adresini kontrol edin.');return result};
export function validateSettings(input,previous){
 if(!input||!Array.isArray(input.groups)||input.groups.length<1||input.groups.length>15)fail('En az bir sınav grubu gerekli.');
 if(input.revision!==previous.revision)fail('Ayarlar başka bir oturumda değişti. Sayfayı yenileyin.',409);
 const ids=new Set();
 const id=value=>{const result=required(value,'Kod',60);if(!/^[a-z0-9-]+$/.test(result)||ids.has(result))fail('Grup ve branş kodları benzersiz olmalı.');ids.add(result);return result};
 const groups=input.groups.map(group=>{
  if(!group||!Array.isArray(group.branches)||!group.branches.length||group.branches.length>50)fail('Her grupta en az bir branş gerekli.');
  return {id:id(group.id),name:required(group.name,'Grup adı',80),branches:group.branches.map(branch=>{
   if(!branch)fail('Geçersiz branş.');
   for(const fee of [branch.candidateFee,branch.registrationFee])if(fee!==null&&(!Number.isFinite(fee)||fee<0||fee>100000||Math.abs(Math.round(fee*100)-fee*100)>.00001))fail('Ücret 0–100.000 TL arasında ve en çok iki ondalıklı olmalı.');
   return {id:id(branch.id),name:required(branch.name,'Branş adı',80),candidateFee:branch.candidateFee,registrationFee:branch.registrationFee};
  })};
 });
 if(input.accepting===true&&groups.every(group=>group.branches.every(branch=>branch.candidateFee===null&&branch.registrationFee===null)))fail('Başvuruları açmadan önce en az bir ücret girin.');
 return {...previous,groups,accepting:input.accepting===true,paymentInstructions:text(input.paymentInstructions,2000),revision:previous.revision+1};
}
export function validateApplication(input,settings){
 if(!settings.accepting)fail('Başvurular henüz açılmadı.',409);
 if(input?.revision!==settings.revision)fail('Branş veya ücret bilgisi güncellendi. Formu yeniden açın; yeni ücreti kontrol ederek başvurun.',409);
 const city=settings.cities.find(item=>item.id===input.city),group=settings.groups.find(item=>item.id===input.group),branch=group?.branches.find(item=>item.id===input.branch);
 if(!city||!group||!branch||!['candidate','registration'].includes(input.feeType))fail('Şehir, sınav ve branş seçimini kontrol edin.');
 const fee=input.feeType==='candidate'?branch.candidateFee:branch.registrationFee;
 if(fee===null)fail('Bu başvuru türü henüz açılmadı.',409);
 const c=input.candidate||{},dob=required(c.dob,'Doğum tarihi',10),date=new Date(dob+'T00:00:00Z'),today=new Date();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dob)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob||date>today||date.getUTCFullYear()<today.getUTCFullYear()-100)fail('Doğum tarihi geçerli olmalı.');
 const tc=text(c.tc,11);if(tc&&!/^[1-9]\d{10}$/.test(tc))fail('T.C. kimlik numarası 11 haneli olmalı.');
 const candidate={firstName:required(c.firstName,'Adayın adı',80),lastName:required(c.lastName,'Adayın soyadı',80),dob,tc,passport:text(c.passport,40),nationality:text(c.nationality,60),gender:text(c.gender,30),phone:phone(c.phone,'Aday telefonu',true),email:email(c.email),province:required(c.province,'İkamet ili',80),district:required(c.district,'İlçe',80),address:required(c.address,'Açık adres',500),school:text(c.school,150),grade:text(c.grade,40)};
 const expected={parents:['mother','father'],mother:['mother'],father:['father'],guardian:['guardian']}[input.familyMode];
 if(!expected||!Array.isArray(input.contacts)||input.contacts.length!==expected.length)fail('Anne, baba veya veli bilgilerini doldurun.');
 const contacts=expected.map(role=>{const contact=input.contacts.find(item=>item?.role===role);if(!contact)fail('Veli bilgisi eksik.');return {role,fullName:required(contact.fullName,'Veli adı soyadı',160),relationship:role==='guardian'?required(contact.relationship,'Yakınlık',60):(role==='mother'?'Anne':'Baba'),occupation:required(contact.occupation,'Meslek',100),phone:phone(contact.phone,'Veli telefonu'),email:email(contact.email)};});
 if(!expected.includes(input.primaryContact))fail('İletişim kurulacak veliyi seçin.');
 if(input.paid!==true&&input.paid!==false)fail('Ödeme durumunu seçin.');
 if(input.confirmation!==true)fail('Başvuru bilgilerini onaylayın.');
 return {city:city.id,cityName:city.name,group:group.id,groupName:group.name,branch:branch.id,branchName:branch.name,feeType:input.feeType,candidate,familyMode:input.familyMode,contacts,primaryContact:input.primaryContact,fee,currency:'TRY',paid:input.paid,confirmation:true,settingsRevision:settings.revision};
}
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sameSecret(a,b){const aa=await digest(a),bb=await digest(b);let delta=0;for(let i=0;i<aa.length;i++)delta|=aa.charCodeAt(i)^bb.charCodeAt(i);return delta===0}
async function boundedBody(request,max){if(Number(request.headers.get('Content-Length'))>max)fail('İstek çok büyük.',413);const reader=request.body?.getReader(),chunks=[];let size=0;if(!reader)return new Uint8Array();while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();fail('İstek çok büyük.',413)}chunks.push(value)}const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength}return result}
async function readJson(request){const raw=new TextDecoder().decode(await boundedBody(request,32768));try{return JSON.parse(raw)}catch{fail('Geçerli bir form gerekli.')}}
function cookieToken(request){return (request.headers.get('Cookie')||'').split(';').map(item=>item.trim()).find(item=>item.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||''}
export class ApplicationStore {
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;
  this.sql.exec('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, status TEXT NOT NULL, payment TEXT NOT NULL, data TEXT NOT NULL, receipt INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT \'\')');
  this.sql.exec('CREATE TABLE IF NOT EXISTS receipts (application_id TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(application_id,part))');
  this.sql.exec('CREATE INDEX IF NOT EXISTS applications_created ON applications(created_at)');
 }
 getSettings(){return JSON.parse(this.sql.exec('SELECT data FROM settings WHERE id=1').toArray()[0]?.data||JSON.stringify(defaultSettings()))}
 rate(key,maximum){const now=Date.now();this.sql.exec('DELETE FROM limits WHERE expires < ?',now);this.sql.exec('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',key,now+15*60*1000);if(this.sql.exec('SELECT count FROM limits WHERE key=?',key).one().count>maximum)fail('Çok fazla deneme. 15 dakika sonra tekrar deneyin.',429)}
 sessionKey(token){return digest(token+'|'+(this.env.NOVA_PANEL_PASSWORD||''))}
 async authorized(request){const token=cookieToken(request);if(!token)return false;const hash=await this.sessionKey(token);const now=Date.now();this.sql.exec('DELETE FROM sessions WHERE expires < ?',now);return this.sql.exec('SELECT token FROM sessions WHERE token=? AND expires>?',hash,now).toArray().length>0}
 async fetch(request){try{
  /* DO aktarımındaki gövdeyi yanıt vermeden önce sınırlandırarak tüket. */
  if(request.body){const max=new URL(request.url).pathname==='/api/applications'?MAX_PDF+65536:32768;const payload=await boundedBody(request,max);request=new Request(request,{body:payload})}
  return await this.handle(request);
 }catch(error){try{if(request.body&&!request.body.locked)await request.body.cancel()}catch{}return reply({error:error.status?error.message:'İşlem tamamlanamadı. Lütfen tekrar deneyin.'},error.status||500)}}
 async handle(request){
  const url=new URL(request.url),path=url.pathname,method=request.method,now=Date.now();
  if(!['GET','HEAD'].includes(method)&&request.headers.get('Origin')!==url.origin)fail('Bu kaynaktan işlem yapılamaz.',403);
  if(path==='/api/applications/config'&&method==='GET')return reply({settings:this.getSettings(),ready:(this.env.NOVA_PANEL_PASSWORD||'').length>=16});
  if(path==='/api/panel/login'&&method==='POST'){
   if(!this.env.NOVA_PANEL_PASSWORD||this.env.NOVA_PANEL_PASSWORD.length<16)fail('Panel kurulumu tamamlanmadı. Cloudflare üzerinde NOVA_PANEL_PASSWORD gizli değişkenini en az 16 karakter olarak tanımlayın.',503);
   this.rate('login:'+(request.headers.get('CF-Connecting-IP')||'local'),5);
   const input=await readJson(request);
   if(typeof input?.password!=='string'||input.password.length>256||!await sameSecret(input.password,this.env.NOVA_PANEL_PASSWORD))fail('Parola hatalı.',401);
   const token=crypto.randomUUID()+crypto.randomUUID();this.sql.exec('INSERT INTO sessions(token,expires) VALUES(?,?)',await this.sessionKey(token),now+8*60*60*1000);
   return reply({ok:true},200,{'Set-Cookie':COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800'});
  }
  if(path.startsWith('/api/panel/')){
   if(!await this.authorized(request))fail('Panel oturumunuz sona erdi. Lütfen giriş yapın.',401);
   if(path==='/api/panel/session'&&method==='GET')return reply({ok:true});
   if(path==='/api/panel/logout'&&method==='POST'){await boundedBody(request,1024);this.sql.exec('DELETE FROM sessions WHERE token=?',await this.sessionKey(cookieToken(request)));return reply({ok:true},200,{'Set-Cookie':COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'})}
   if(path==='/api/panel/settings'&&method==='GET')return reply({settings:this.getSettings()});
   if(path==='/api/panel/settings'&&method==='PUT'){
    const input=await readJson(request);let settings;
    this.ctx.storage.transactionSync(()=>{settings=validateSettings(input,this.getSettings());this.sql.exec('INSERT INTO settings(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(settings))});
    return reply({settings});
   }
   if(path==='/api/panel/applications'&&method==='GET'){
    const page=Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1)),query=(url.searchParams.get('q')||'').trim().slice(0,160),status=url.searchParams.get('status')||'',city=url.searchParams.get('city')||'';
    const where='WHERE (?=\'\' OR instr(lower(name),lower(?))>0) AND (?=\'\' OR status=?) AND (?=\'\' OR city=?)',args=[query,query,status,status,city,city];
    const total=this.sql.exec('SELECT count(*) AS count FROM applications '+where,...args).one().count;
    const rows=this.sql.exec('SELECT id,created_at,name,city,status,payment,receipt,data FROM applications '+where+' ORDER BY created_at DESC,id DESC LIMIT 30 OFFSET ?',...args,(page-1)*30).toArray();
    return reply({total,page,applications:rows.map(({data,...row})=>{const item=JSON.parse(data);return {...row,cityName:item.cityName,groupName:item.groupName,branchName:item.branchName,fee:item.fee}})});
   }
   const match=path.match(/^\/api\/panel\/applications\/([a-f0-9-]{36})(\/receipt)?$/);
   if(match){
    const row=this.sql.exec('SELECT * FROM applications WHERE id=?',match[1]).toArray()[0];if(!row)fail('Başvuru bulunamadı.',404);
    if(match[2]&&method==='GET'){
     if(!row.receipt)fail('Dekont bulunamadı.',404);
     const chunks=this.sql.exec('SELECT data FROM receipts WHERE application_id=? ORDER BY part',row.id).toArray().map(item=>item.data);
     return new Response(new Blob(chunks,{type:'application/pdf'}),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="dekont-'+row.id+'.pdf"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox"}});
    }
    if(!match[2]&&method==='GET')return reply({application:{id:row.id,createdAt:row.created_at,status:row.status,payment:row.payment,receipt:!!row.receipt,note:row.note,...JSON.parse(row.data)}});
    if(!match[2]&&method==='PATCH'){
     const input=await readJson(request);
     if(!['yeni','inceleniyor','eksik-bilgi','tamamlandi'].includes(input.status)||!['odenmedi','beyan-edildi','dogrulandi'].includes(input.payment))fail('Geçersiz durum.');
     if(input.payment==='beyan-edildi'&&!row.receipt)fail('Ödeme beyanı için dekont bulunmalı.');
     this.sql.exec('UPDATE applications SET status=?,payment=?,note=? WHERE id=?',input.status,input.payment,text(input.note,2000),row.id);return reply({ok:true});
    }
   }
   fail('İşlem bulunamadı.',404);
  }
  if(path==='/api/applications'&&method==='POST'){
   if((this.env.NOVA_PANEL_PASSWORD||'').length<16)fail('Başvuru sistemi henüz açılmadı.',503);
   this.rate('apply:'+(request.headers.get('CF-Connecting-IP')||'local'),15);
   if(Number(request.headers.get('Content-Length'))>MAX_PDF+65536)fail('Dekont en fazla 5 MB olabilir.',413);
   const payload=await boundedBody(request,MAX_PDF+65536);
   let form;try{form=await new Response(payload,{headers:{'Content-Type':request.headers.get('Content-Type')||''}}).formData()}catch{fail('Geçersiz form verisi.')}
   const raw=form.get('data');if(typeof raw!=='string'||raw.length>24000)fail('Geçersiz başvuru.');
   let input;try{input=JSON.parse(raw)}catch{fail('Geçersiz başvuru.')}if(!input||typeof input!=='object'||Array.isArray(input))fail('Geçersiz başvuru.');
   const requestId=required(input.requestId,'Başvuru kodu',36);if(!/^[a-f0-9-]{36}$/.test(requestId))fail('Başvuru kodu geçersiz.');
   const previous=this.sql.exec('SELECT id FROM applications WHERE request_id=?',requestId).toArray()[0];if(previous)return reply({id:previous.id},200);
   const data=validateApplication(input,this.getSettings()),file=form.get('receipt');let bytes;
   if(data.paid){
    if(!file||typeof file==='string'||!file.size||file.size>MAX_PDF)fail('Ödendi seçildiğinde en fazla 5 MB PDF dekont yükleyin.');
    bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')fail('Dekont geçerli bir PDF dosyası olmalı.');
   }else if(file&&typeof file!=='string'&&file.size)fail('Ödenmedi seçimiyle dekont gönderilemez.');
   const id=crypto.randomUUID(),createdAt=new Date().toISOString();
   this.ctx.storage.transactionSync(()=>{
    /* PDF okunurken ayarlar değişmiş olabilir: aynı işlemde yeniden doğrula. */
    validateApplication(input,this.getSettings());
    const duplicate=this.sql.exec('SELECT id FROM applications WHERE request_id=?',requestId).toArray()[0];if(duplicate)return;
    this.sql.exec('INSERT INTO applications(id,request_id,created_at,name,city,status,payment,data,receipt) VALUES(?,?,?,?,?,?,?,?,?)',id,requestId,createdAt,data.candidate.firstName+' '+data.candidate.lastName,data.city,'yeni',data.paid?'beyan-edildi':'odenmedi',JSON.stringify(data),bytes?1:0);
    if(bytes)for(let part=0,offset=0;offset<bytes.length;part++,offset+=65536)this.sql.exec('INSERT INTO receipts(application_id,part,data) VALUES(?,?,?)',id,part,bytes.slice(offset,offset+65536).buffer);
   });
   return reply({id:this.sql.exec('SELECT id FROM applications WHERE request_id=?',requestId).one().id},201);
  }
  return reply({error:'İşlem bulunamadı.'},404);
 }
}
