import {MAX_VIDEO_BYTES, initializeSiteMedia, videoSettings, saveActivityVideo, removeActivityVideo, serveActivityVideo} from './site-media.js';
import districtsByProvince from './turkiye-il-ilce.js';
const MAX_PDF = 5 * 1024 * 1024;
const MIN_PANEL_PASSWORD_LENGTH = 8;
const COOKIE = '__Host-nova-panel';
export const defaultSettings = () => ({
  revision: 1, accepting: false, paymentInstructions: '', applicationContract: 'NOVA Sanat ve Spor Kulübü Sınav Başvurusu Sözleşmesi\n\n1. Başvuru sahibi, formda verdiği bilgilerin doğru ve güncel olduğunu beyan eder.\n2. Başvuru, sınav değerlendirmesine katılım talebidir; kabul veya kesin kayıt garantisi vermez.\n3. Aday, sınav günü duyurulan saat ve yerde hazır bulunur; gerekli belgeleri yanında getirir.\n4. Sınav ücretinin yatırılması ve dekontun yüklenmesi başvurunun değerlendirmeye alınması için gereklidir.\n5. Kişisel veriler, başvurunun alınması, sınavın yürütülmesi ve adayla iletişim kurulması amacıyla işlenir.\n6. Başvuru sahibi bu koşulları okuyup kabul ettiğini onaylar.',
  groups: [
    {id:'sanat',name:'Sahne Sanatları ve Senfoni Orkestrası',branches:[{id:'dans-sahne',name:'Dans ve Sahne Sanatları Sınavı',candidateFee:null,registrationFee:null},{id:'senfoni',name:'Senfoni Orkestrası Sınavı',candidateFee:null,registrationFee:null}]},
    {id:'spor',name:'Spor Akademisi',branches:[{id:'basketbol',name:'Basketbol Sınavı',candidateFee:null,registrationFee:null},{id:'voleybol',name:'Voleybol Sınavı',candidateFee:null,registrationFee:null},{id:'futbol',name:'Futbol Sınavı',candidateFee:null,registrationFee:null},{id:'futsal',name:'Futsal Sınavı',candidateFee:null,registrationFee:null}]}
  ], cities:[{"id":"adana","name":"Adana","provinceIds":["adana"]},{"id":"adiyaman","name":"Adıyaman","provinceIds":["adiyaman"]},{"id":"afyonkarahisar","name":"Afyonkarahisar","provinceIds":["afyonkarahisar"]},{"id":"agri","name":"Ağrı","provinceIds":["agri"]},{"id":"amasya","name":"Amasya","provinceIds":["amasya"]},{"id":"ankara","name":"Ankara","provinceIds":["ankara"]},{"id":"antalya","name":"Antalya","provinceIds":["antalya"]},{"id":"artvin","name":"Artvin","provinceIds":["artvin"]},{"id":"aydin","name":"Aydın","provinceIds":["aydin"]},{"id":"balikesir","name":"Balıkesir","provinceIds":["balikesir"]},{"id":"bilecik","name":"Bilecik","provinceIds":["bilecik"]},{"id":"bingol","name":"Bingöl","provinceIds":["bingol"]},{"id":"bitlis","name":"Bitlis","provinceIds":["bitlis"]},{"id":"bolu","name":"Bolu","provinceIds":["bolu"]},{"id":"burdur","name":"Burdur","provinceIds":["burdur"]},{"id":"bursa","name":"Bursa","provinceIds":["bursa"]},{"id":"canakkale","name":"Çanakkale","provinceIds":["canakkale"]},{"id":"cankiri","name":"Çankırı","provinceIds":["cankiri"]},{"id":"corum","name":"Çorum","provinceIds":["corum"]},{"id":"denizli","name":"Denizli","provinceIds":["denizli"]},{"id":"diyarbakir","name":"Diyarbakır","provinceIds":["diyarbakir"]},{"id":"edirne","name":"Edirne","provinceIds":["edirne"]},{"id":"elazig","name":"Elazığ","provinceIds":["elazig"]},{"id":"erzincan","name":"Erzincan","provinceIds":["erzincan"]},{"id":"erzurum","name":"Erzurum","provinceIds":["erzurum"]},{"id":"eskisehir","name":"Eskişehir","provinceIds":["eskisehir"]},{"id":"antep","name":"Gaziantep","provinceIds":["gaziantep"]},{"id":"giresun","name":"Giresun","provinceIds":["giresun"]},{"id":"gumushane","name":"Gümüşhane","provinceIds":["gumushane"]},{"id":"hakkari","name":"Hakkâri","provinceIds":["hakkari"]},{"id":"hatay","name":"Hatay","provinceIds":["hatay"]},{"id":"isparta","name":"Isparta","provinceIds":["isparta"]},{"id":"mersin","name":"Mersin","provinceIds":["mersin"]},{"id":"istanbul","name":"İstanbul","provinceIds":["istanbul-asya","istanbul-avrupa"]},{"id":"izmir","name":"İzmir","provinceIds":["izmir"]},{"id":"kars","name":"Kars","provinceIds":["kars"]},{"id":"kastamonu","name":"Kastamonu","provinceIds":["kastamonu"]},{"id":"kayseri","name":"Kayseri","provinceIds":["kayseri"]},{"id":"kirklareli","name":"Kırklareli","provinceIds":["kirklareli"]},{"id":"kirsehir","name":"Kırşehir","provinceIds":["kirsehir"]},{"id":"kocaeli","name":"Kocaeli","provinceIds":["kocaeli"]},{"id":"konya","name":"Konya","provinceIds":["konya"]},{"id":"kutahya","name":"Kütahya","provinceIds":["kutahya"]},{"id":"malatya","name":"Malatya","provinceIds":["malatya"]},{"id":"manisa","name":"Manisa","provinceIds":["manisa"]},{"id":"kahramanmaras","name":"Kahramanmaraş","provinceIds":["kahramanmaras"]},{"id":"mardin","name":"Mardin","provinceIds":["mardin"]},{"id":"mugla","name":"Muğla","provinceIds":["mugla"]},{"id":"mus","name":"Muş","provinceIds":["mus"]},{"id":"nevsehir","name":"Nevşehir","provinceIds":["nevsehir"]},{"id":"nigde","name":"Niğde","provinceIds":["nigde"]},{"id":"ordu","name":"Ordu","provinceIds":["ordu"]},{"id":"rize","name":"Rize","provinceIds":["rize"]},{"id":"sakarya","name":"Sakarya","provinceIds":["sakarya"]},{"id":"samsun","name":"Samsun","provinceIds":["samsun"]},{"id":"siirt","name":"Siirt","provinceIds":["siirt"]},{"id":"sinop","name":"Sinop","provinceIds":["sinop"]},{"id":"sivas","name":"Sivas","provinceIds":["sivas"]},{"id":"tekirdag","name":"Tekirdağ","provinceIds":["tekirdag"]},{"id":"tokat","name":"Tokat","provinceIds":["tokat"]},{"id":"trabzon","name":"Trabzon","provinceIds":["trabzon"]},{"id":"tunceli","name":"Tunceli","provinceIds":["tunceli"]},{"id":"sanliurfa","name":"Şanlıurfa","provinceIds":["sanliurfa"]},{"id":"usak","name":"Uşak","provinceIds":["usak"]},{"id":"van","name":"Van","provinceIds":["van"]},{"id":"yozgat","name":"Yozgat","provinceIds":["yozgat"]},{"id":"zonguldak","name":"Zonguldak","provinceIds":["zonguldak"]},{"id":"aksaray","name":"Aksaray","provinceIds":["aksaray"]},{"id":"bayburt","name":"Bayburt","provinceIds":["bayburt"]},{"id":"karaman","name":"Karaman","provinceIds":["karaman"]},{"id":"kirikkale","name":"Kırıkkale","provinceIds":["kirikkale"]},{"id":"batman","name":"Batman","provinceIds":["batman"]},{"id":"sirnak","name":"Şırnak","provinceIds":["sirnak"]},{"id":"bartin","name":"Bartın","provinceIds":["bartin"]},{"id":"ardahan","name":"Ardahan","provinceIds":["ardahan"]},{"id":"igdir","name":"Iğdır","provinceIds":["igdir"]},{"id":"yalova","name":"Yalova","provinceIds":["yalova"]},{"id":"karabuk","name":"Karabük","provinceIds":["karabuk"]},{"id":"kilis","name":"Kilis","provinceIds":["kilis"]},{"id":"osmaniye","name":"Osmaniye","provinceIds":["osmaniye"]},{"id":"duzce","name":"Düzce","provinceIds":["duzce"]}]
});
export function reply(data,status=200,headers={}) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
export function publicOriginAllowed(origin,ownOrigin,env){return origin===ownOrigin||origin==='https://nova-akademi.vercel.app'||(!!env.NOVA_SITE_ORIGIN&&origin===env.NOVA_SITE_ORIGIN)}
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const text=(value,max=200)=>{if(typeof value!=='string'||value.length>max)fail('Geçersiz veya çok uzun bilgi.');return value.trim()};
const required=(value,label,max=200)=>{const result=text(value,max);if(!result)fail(label+' gerekli.');return result};
const titleCaseTr=value=>value.toLocaleLowerCase('tr-TR').replace(/(^|[\s'-])(\p{L})/gu,(_,space,char)=>space+char.toLocaleUpperCase('tr-TR'));
const phone=(value,label,optional=false)=>{const result=text(value,30);if(optional&&!result)return '';if(!/^\+?[\d\s()\-]{10,25}$/.test(result))fail(label+' geçerli olmalı.');return result};
const email=value=>{const result=text(value??'',150);if(result&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))fail('E-posta adresini kontrol edin.');return result};
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
 const cityIds=new Set(defaultSettings().cities.map(city=>city.id)),branchIds=new Set(groups.flatMap(group=>group.branches.map(branch=>branch.id))),submittedCityExams=input.cityExams??previous.cityExams??{};
 if(!submittedCityExams||typeof submittedCityExams!=='object'||Array.isArray(submittedCityExams))fail('Şehir sınav eşleştirmelerini kontrol edin.');
 const cityExams={};
 for(const [cityId,assigned] of Object.entries(submittedCityExams)){
  if(!cityIds.has(cityId)||!Array.isArray(assigned)||assigned.length>groups.reduce((total,group)=>total+group.branches.length,0))fail('Geçersiz sınav merkezi eşleştirmesi.');
  const unique=[...new Set(assigned)];
  if(unique.some(branchId=>typeof branchId!=='string'||!branchIds.has(branchId)))fail('Şehir için seçilen sınavlardan biri artık mevcut değil.');
  if(unique.length)cityExams[cityId]=unique;
 }
 return {...previous,groups,cityExams,accepting:input.accepting===true,paymentInstructions:text(input.paymentInstructions,2000),applicationContract:input.applicationContract===undefined?(previous.applicationContract||defaultSettings().applicationContract):text(input.applicationContract,6000),revision:previous.revision+1};
}
function validTckn(value){if(!/^[1-9]\d{10}$/.test(value))return false;const d=[...value].map(Number);const tenth=((d[0]+d[2]+d[4]+d[6]+d[8])*7-(d[1]+d[3]+d[5]+d[7])+100)%10;return d[9]===tenth&&d[10]===d.slice(0,10).reduce((a,b)=>a+b,0)%10}
const cityCode=id=>{
 const preferred={adana:'ADA',ankara:'ANK',istanbul:'IST',sakarya:'SAK',bursa:'BUR',izmir:'IZM',antalya:'ANT',mersin:'MER',antep:'GAZ',diyarbakir:'DIY',erzurum:'ERZ',van:'VAN',samsun:'SAM',trabzon:'TRA',ordu:'ORD',eskisehir:'ESK'},cities=defaultSettings().cities,used=new Set(),codes={};
 const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 for(const city of cities){const normalized=city.id.toLocaleUpperCase('tr-TR').replace(/İ/g,'I').replace(/[^A-Z]/g,''),base=preferred[city.id]||normalized.slice(0,3).padEnd(3,'X');let code=base;
  if(used.has(code)){code='';for(const char of letters){const candidate=normalized.slice(0,2).padEnd(2,'X')+char;if(!used.has(candidate)){code=candidate;break}}}
  if(!code){for(const a of letters){for(const b of letters){for(const c of letters){const candidate=a+b+c;if(!used.has(candidate)){code=candidate;break}}if(code)break}if(code)break}}
  codes[city.id]=code;used.add(code);
 }
 return codes[id]||'NOV';
};
export function makeXlsx(rows){
 const encoder=new TextEncoder(),table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
 const crc=bytes=>{let value=0xffffffff;for(const byte of bytes)value=table[(value^byte)&255]^(value>>>8);return (value^0xffffffff)>>>0},u16=(view,offset,value)=>view.setUint16(offset,value,true),u32=(view,offset,value)=>view.setUint32(offset,value,true),chunks=[],central=[];let offset=0;
 const files=rows.map((xml,index)=>({name:['[Content_Types].xml','_rels/.rels','xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/worksheets/sheet1.xml'][index],data:encoder.encode(xml)}));
 for(const file of files){const name=encoder.encode(file.name),checksum=crc(file.data),local=new Uint8Array(30+name.length),view=new DataView(local.buffer);u32(view,0,0x04034b50);u16(view,4,20);u16(view,6,0);u16(view,8,0);u16(view,10,0);u16(view,12,0);u32(view,14,checksum);u32(view,18,file.data.length);u32(view,22,file.data.length);u16(view,26,name.length);u16(view,28,0);local.set(name,30);chunks.push(local,file.data);
  const record=new Uint8Array(46+name.length),centralView=new DataView(record.buffer);u32(centralView,0,0x02014b50);u16(centralView,4,20);u16(centralView,6,20);u16(centralView,8,0);u16(centralView,10,0);u16(centralView,12,0);u16(centralView,14,0);u32(centralView,16,checksum);u32(centralView,20,file.data.length);u32(centralView,24,file.data.length);u16(centralView,28,name.length);u16(centralView,30,0);u16(centralView,32,0);u16(centralView,34,0);u16(centralView,36,0);u32(centralView,38,0);u32(centralView,42,offset);record.set(name,46);central.push(record);offset+=local.length+file.data.length;
 }
 const centralSize=central.reduce((sum,item)=>sum+item.length,0),end=new Uint8Array(22),endView=new DataView(end.buffer);u32(endView,0,0x06054b50);u16(endView,4,0);u16(endView,6,0);u16(endView,8,files.length);u16(endView,10,files.length);u32(endView,12,centralSize);u32(endView,16,offset);u16(endView,20,0);const parts=[...chunks,...central,end],output=new Uint8Array(parts.reduce((sum,item)=>sum+item.length,0));let cursor=0;for(const item of parts){output.set(item,cursor);cursor+=item.length}return output;
}
export function validateApplication(input,settings){
 if(!settings.accepting)fail('Başvurular henüz açılmadı.',409);
 if(input?.revision!==settings.revision)fail('Branş veya ücret bilgisi güncellendi. Formu yeniden açın; yeni ücreti kontrol ederek başvurun.',409);
 const city=defaultSettings().cities.find(item=>item.id===input.city),group=settings.groups.find(item=>item.id===input.group),branch=group?.branches.find(item=>item.id===input.branch);
 if(!city||!group||!branch||input.feeType!=='candidate')fail('Şehir ve sınav seçimini kontrol edin.');
 if(!(settings.cityExams?.[city.id]||[]).includes(branch.id))fail('Bu şehirde seçtiğiniz sınav tanımlı değil.',409);
 const fee=input.feeType==='candidate'?branch.candidateFee:branch.registrationFee;
 if(fee===null)fail('Bu başvuru türü henüz açılmadı.',409);
 const c=input.candidate||{},dob=required(c.dob,'Doğum tarihi',10),date=new Date(dob+'T00:00:00Z'),today=new Date();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dob)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob||date>today||date.getUTCFullYear()<today.getUTCFullYear()-100)fail('Doğum tarihi geçerli olmalı.');
 const tc=required(c.tc,'T.C. kimlik numarası',11);if(!validTckn(tc))fail('T.C. kimlik numarası geçerli değil.');
 const location=required(c.province,'İkamet ili',80),district=required(c.district,'İlçe',80);if(!defaultSettings().cities.some(item=>item.name===location))fail('İkamet ili listeden seçilmeli.');if(!districtsByProvince[location]?.includes(district))fail('İlçe seçilen ile ait değil.');
 const candidate={firstName:required(c.firstName,'Adayın adı',80),lastName:required(c.lastName,'Adayın soyadı',80),dob,tc,gender:text(c.gender??'',30),phone:phone(c.phone,'Aday telefonu'),email:email(c.email),province:location,district,address:required(c.address,'Açık adres',500),school:text(c.school??'',150).toLocaleUpperCase('tr-TR'),grade:text(c.grade??'',40).toLocaleUpperCase('tr-TR')};
 const expected={parents:['mother','father'],mother:['mother'],father:['father'],guardian:['guardian']}[input.familyMode];
 if(!expected||!Array.isArray(input.contacts)||input.contacts.length!==expected.length)fail('Anne, baba veya veli bilgilerini doldurun.');
 const contacts=expected.map(role=>{const contact=input.contacts.find(item=>item?.role===role);if(!contact)fail('Veli bilgisi eksik.');return {role,fullName:titleCaseTr(required(contact.fullName,'Veli Adı Soyadı',160)),relationship:role==='guardian'?required(contact.relationship,'Yakınlık',60):(role==='mother'?'Anne':'Baba'),occupation:required(contact.occupation,'Meslek',100).toLocaleUpperCase('tr-TR'),phone:phone(contact.phone,'Veli telefonu'),email:email(contact.email)};});
 if(!expected.includes(input.primaryContact))fail('İletişim kurulacak veliyi seçin.');
 if(input.paid!==true&&input.paid!==false)fail('Ödeme durumunu seçin.');
 if(input.contractAccepted!==true)fail('Sınav başvurusu sözleşmesini onaylayın.');
 if(input.confirmation!==true)fail('Başvuru bilgilerini kontrol edip onaylayın.');
 return {city:city.id,cityName:city.name,group:group.id,groupName:group.name,branch:branch.id,branchName:branch.name,feeType:'candidate',candidate,familyMode:input.familyMode,contacts,primaryContact:input.primaryContact,fee,currency:'TRY',paid:input.paid,contractAccepted:true,confirmation:true,settingsRevision:settings.revision};
}
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sameSecret(a,b){const aa=await digest(a),bb=await digest(b);let delta=0;for(let i=0;i<aa.length;i++)delta|=aa.charCodeAt(i)^bb.charCodeAt(i);return delta===0}
export async function boundedBody(request,max){if(Number(request.headers.get('Content-Length'))>max)fail('İstek çok büyük.',413);const reader=request.body?.getReader(),chunks=[];let size=0;if(!reader)return new Uint8Array();while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();fail('İstek çok büyük.',413)}chunks.push(value)}const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength}return result}
async function readJson(request){const raw=new TextDecoder().decode(await boundedBody(request,32768));try{return JSON.parse(raw)}catch{fail('Geçerli bir form gerekli.')}}
function cookieToken(request){return (request.headers.get('Cookie')||'').split(';').map(item=>item.trim()).find(item=>item.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||''}
export class ApplicationStore {
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;
  initializeSiteMedia(this.sql);
  this.sql.exec('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, reference TEXT, created_at TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, status TEXT NOT NULL, payment TEXT NOT NULL, data TEXT NOT NULL, receipt INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT \'\')');
  if(!this.sql.exec('PRAGMA table_info(applications)').toArray().some(column=>column.name==='reference'))this.sql.exec('ALTER TABLE applications ADD COLUMN reference TEXT');
  this.sql.exec('CREATE UNIQUE INDEX IF NOT EXISTS applications_reference ON applications(reference)');
  const legacy=this.sql.exec('SELECT id,city FROM applications WHERE reference IS NULL ORDER BY created_at,id').toArray(),sequences={};
  for(const row of legacy){sequences[row.city]=(sequences[row.city]||0)+1;this.sql.exec('UPDATE applications SET reference=? WHERE id=?','01-'+cityCode(row.city)+'-'+String(sequences[row.city]).padStart(3,'0'),row.id)}
  this.sql.exec('CREATE TABLE IF NOT EXISTS receipts (application_id TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(application_id,part))');
  this.sql.exec('CREATE INDEX IF NOT EXISTS applications_created ON applications(created_at)');
 }
 getSettings(){const settings=JSON.parse(this.sql.exec('SELECT data FROM settings WHERE id=1').toArray()[0]?.data||JSON.stringify(defaultSettings()));settings.cities=defaultSettings().cities;if(!settings.applicationContract)settings.applicationContract=defaultSettings().applicationContract;if(!settings.cityExams||typeof settings.cityExams!=='object'||Array.isArray(settings.cityExams))settings.cityExams={};return settings}
 rate(key,maximum){const now=Date.now();this.sql.exec('DELETE FROM limits WHERE expires < ?',now);this.sql.exec('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',key,now+15*60*1000);if(this.sql.exec('SELECT count FROM limits WHERE key=?',key).one().count>maximum)fail('Çok fazla deneme. 15 dakika sonra tekrar deneyin.',429)}
 sessionKey(token){return digest(token+'|'+(this.env.NOVA_PANEL_PASSWORD||''))}
 async authorized(request){const token=cookieToken(request);if(!token)return false;const hash=await this.sessionKey(token);const now=Date.now();this.sql.exec('DELETE FROM sessions WHERE expires < ?',now);return this.sql.exec('SELECT token FROM sessions WHERE token=? AND expires>?',hash,now).toArray().length>0}
 async fetch(request){try{
  /* DO aktarımındaki gövdeyi yanıt vermeden önce sınırlandırarak tüket. */
  if(request.body){const path=new URL(request.url).pathname;const max=path==='/api/applications'?MAX_PDF+65536:path==='/api/panel/activity-video'?MAX_VIDEO_BYTES:32768;const payload=await boundedBody(request,max);request=new Request(request,{body:payload})}
  return await this.handle(request);
 }catch(error){try{if(request.body&&!request.body.locked)await request.body.cancel()}catch{}return reply({error:error.status?error.message:'İşlem tamamlanamadı. Lütfen tekrar deneyin.'},error.status||500)}}
 async handle(request){
  const url=new URL(request.url),path=url.pathname,method=request.method,now=Date.now();
  const origin=request.headers.get('Origin');
  if(!['GET','HEAD'].includes(method)&&origin!==url.origin&&!(path==='/api/applications'&&publicOriginAllowed(origin,url.origin,this.env)))fail('Bu kaynaktan işlem yapılamaz.',403);
  if(path==='/api/site-media/activity-video'&&method==='GET')return reply(videoSettings(this.sql));
  if(path==='/api/site-media/activity-video/file'&&['GET','HEAD'].includes(method))return serveActivityVideo(request,this.sql);
  if(path==='/api/applications/config'&&method==='GET')return reply({settings:this.getSettings(),ready:(this.env.NOVA_PANEL_PASSWORD||'').length>=MIN_PANEL_PASSWORD_LENGTH});
  if(path==='/api/applications/track'&&method==='GET'){
   this.rate('track:'+(request.headers.get('CF-Connecting-IP')||'local'),60);
   const reference=(url.searchParams.get('reference')||'').trim().toUpperCase();if(!/^\d{2}-[A-ZÇĞİÖŞÜ]{3}-\d{3,}$/.test(reference))return reply({found:false});
   const row=this.sql.exec('SELECT reference,created_at,city,status,data FROM applications WHERE reference=?',reference).toArray()[0];if(!row)return reply({found:false});
   const item=JSON.parse(row.data),status=['onaylandi','reddedildi'].includes(row.status)?row.status:'kontrol-ediliyor';
   return reply({found:true,reference:row.reference,city:item.cityName,branch:item.branchName,status,createdAt:row.created_at});
  }
  if(path==='/api/panel/login'&&method==='POST'){
   if(!this.env.NOVA_PANEL_PASSWORD||this.env.NOVA_PANEL_PASSWORD.length<MIN_PANEL_PASSWORD_LENGTH)fail('Panel kurulumu tamamlanmadı. Cloudflare üzerinde NOVA_PANEL_PASSWORD gizli değişkenini en az 8 karakter olarak tanımlayın.',503);
   this.rate('login:'+(request.headers.get('CF-Connecting-IP')||'local'),5);
   const input=await readJson(request);
   if(typeof input?.password!=='string'||input.password.length>256||!await sameSecret(input.password,this.env.NOVA_PANEL_PASSWORD))fail('Parola hatalı.',401);
   const token=crypto.randomUUID()+crypto.randomUUID();this.sql.exec('INSERT INTO sessions(token,expires) VALUES(?,?)',await this.sessionKey(token),now+8*60*60*1000);
   return reply({ok:true},200,{'Set-Cookie':COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800'});
  }
  if(path.startsWith('/api/panel/')){
   if(!await this.authorized(request))fail('Panel oturumunuz sona erdi. Lütfen giriş yapın.',401);
   if(path==='/api/panel/activity-video'){
    if(method==='GET')return reply(videoSettings(this.sql));
    if(method==='PUT')return saveActivityVideo(request,this);
    if(method==='DELETE'){await boundedBody(request,1024);return removeActivityVideo(this)}
   }
   if(path==='/api/panel/session'&&method==='GET')return reply({ok:true});
   if(path==='/api/panel/logout'&&method==='POST'){await boundedBody(request,1024);this.sql.exec('DELETE FROM sessions WHERE token=?',await this.sessionKey(cookieToken(request)));return reply({ok:true},200,{'Set-Cookie':COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'})}
   if(path==='/api/panel/settings'&&method==='GET')return reply({settings:this.getSettings()});
   if(path==='/api/panel/settings'&&method==='PUT'){
    const input=await readJson(request);let settings;
    this.ctx.storage.transactionSync(()=>{settings=validateSettings(input,this.getSettings());this.sql.exec('INSERT INTO settings(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(settings))});
    return reply({settings});
   }
   if(path==='/api/panel/applications'&&method==='GET'){
    const page=Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1)),query=(url.searchParams.get('q')||'').trim().slice(0,160),status=url.searchParams.get('status')||'',city=url.searchParams.get('city')||'',branch=(url.searchParams.get('branch')||'').trim().slice(0,80);
    const where='WHERE (?=\'\' OR instr(lower(name),lower(?))>0) AND (?=\'\' OR status=?) AND (?=\'\' OR city=?) AND (?=\'\' OR instr(data,?)>0)',args=[query,query,status,status,city,city,branch,branch?'\"branch\":\"'+branch+'\"':''];
    const total=this.sql.exec('SELECT count(*) AS count FROM applications '+where,...args).one().count;
    if(url.searchParams.get('export')==='csv'){
     const rows=this.sql.exec('SELECT reference,created_at,name,city,status,payment,receipt,data FROM applications '+where+' ORDER BY created_at DESC,id DESC',...args).toArray();
     const cell=value=>{let output=String(value??'');if(/^[=+@\-\t\r]/.test(output))output="'"+output;return '"'+output.replace(/"/g,'""')+'"'};
     const lines=[['Başvuru No','Tarih','Aday','İl','İkamet İli','İlçe','Ana Sınav','Sınav / Branş','Ücret (TL)','Durum','Ödeme','Aday Telefonu','E-posta','Veli Adı Soyadı','Veli Telefonu'].map(cell).join(';')];
     for(const row of rows){const item=JSON.parse(row.data),contact=item.contacts.find(value=>value.role===item.primaryContact)||item.contacts[0]||{};lines.push([row.reference,row.created_at,row.name,item.cityName,item.candidate.province,item.candidate.district,item.groupName,item.branchName,item.fee,row.status,row.payment,item.candidate.phone,item.candidate.email,contact.fullName,contact.phone].map(cell).join(';'))}
     return new Response('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="nova-basvurular.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    if(url.searchParams.get('export')==='xlsx'){
     const records=[['Başvuru No','Tarih','Aday','İl','İkamet İli','İlçe','Ana Sınav','Sınav / Branş','Ücret (TL)','Durum','Ödeme','Aday Telefonu','E-posta','Veli Adı Soyadı','Veli Telefonu']];
     const exportRows=this.sql.exec('SELECT reference,created_at,name,city,status,payment,data FROM applications '+where+' ORDER BY created_at DESC,id DESC',...args).toArray();
     for(const row of exportRows){const item=JSON.parse(row.data),contact=item.contacts.find(value=>value.role===item.primaryContact)||item.contacts[0]||{};records.push([row.reference,row.created_at,row.name,item.cityName,item.candidate.province,item.candidate.district,item.groupName,item.branchName,item.fee,row.status,row.payment,item.candidate.phone,item.candidate.email,contact.fullName,contact.phone])}
     const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
     const column=index=>{let result='';for(index++;index;index=Math.floor((index-1)/26))result=String.fromCharCode(65+(index-1)%26)+result;return result};
     const sheet='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+records.map((record,rowIndex)=>'<row r="'+(rowIndex+1)+'">'+record.map((value,colIndex)=>'<c r="'+column(colIndex)+(rowIndex+1)+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData></worksheet>';
     const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
     const rootRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
     const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Başvurular" sheetId="1" r:id="rId1"/></sheets></workbook>';
     const workbookRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
     const workbookBytes=makeXlsx([contentTypes,rootRels,workbook,workbookRels,sheet]);return new Response(workbookBytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="nova-basvurular.xlsx"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    const rows=this.sql.exec('SELECT id,reference,created_at,name,city,status,payment,receipt,data FROM applications '+where+' ORDER BY created_at DESC,id DESC LIMIT 30 OFFSET ?',...args,(page-1)*30).toArray();
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
    if(!match[2]&&method==='GET')return reply({application:{id:row.id,reference:row.reference,createdAt:row.created_at,status:row.status,payment:row.payment,receipt:!!row.receipt,note:row.note,...JSON.parse(row.data)}});
    if(!match[2]&&method==='PATCH'){
     const input=await readJson(request);
     if(!['yeni','inceleniyor','onaylandi','reddedildi'].includes(input.status)||!['odenmedi','beyan-edildi','dogrulandi'].includes(input.payment))fail('Geçersiz durum.');
     if(input.payment==='beyan-edildi'&&!row.receipt)fail('Ödeme beyanı için dekont bulunmalı.');
     this.sql.exec('UPDATE applications SET status=?,payment=?,note=? WHERE id=?',input.status,input.payment,text(input.note,2000),row.id);return reply({ok:true});
    }
   }
   fail('İşlem bulunamadı.',404);
  }
  if(path==='/api/applications'&&method==='POST'){
   if((this.env.NOVA_PANEL_PASSWORD||'').length<MIN_PANEL_PASSWORD_LENGTH)fail('Başvuru sistemi henüz açılmadı.',503);
   this.rate('apply:'+(request.headers.get('CF-Connecting-IP')||'local'),15);
   if(Number(request.headers.get('Content-Length'))>MAX_PDF+65536)fail('Dekont en fazla 5 MB olabilir.',413);
   const payload=await boundedBody(request,MAX_PDF+65536);
   let form;try{form=await new Response(payload,{headers:{'Content-Type':request.headers.get('Content-Type')||''}}).formData()}catch{fail('Geçersiz form verisi.')}
   const raw=form.get('data');if(typeof raw!=='string'||raw.length>24000)fail('Geçersiz başvuru.');
   let input;try{input=JSON.parse(raw)}catch{fail('Geçersiz başvuru.')}if(!input||typeof input!=='object'||Array.isArray(input))fail('Geçersiz başvuru.');
   const requestId=required(input.requestId,'Başvuru kodu',36);if(!/^[a-f0-9-]{36}$/.test(requestId))fail('Başvuru kodu geçersiz.');
   const previous=this.sql.exec('SELECT id,reference FROM applications WHERE request_id=?',requestId).toArray()[0];if(previous)return reply({id:previous.id,reference:previous.reference},200);
   const data=validateApplication(input,this.getSettings()),file=form.get('receipt');let bytes;
   if(data.paid){
    if(!file||typeof file==='string'||!file.size||file.size>MAX_PDF)fail('Ödendi seçildiğinde en fazla 5 MB PDF dekont yükleyin.');
    bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')fail('Dekont geçerli bir PDF dosyası olmalı.');
   }else if(file&&typeof file!=='string'&&file.size)fail('Ödenmedi seçimiyle dekont gönderilemez.');
   const id=crypto.randomUUID(),createdAt=new Date().toISOString();
   let reference='';this.ctx.storage.transactionSync(()=>{
    /* PDF okunurken ayarlar değişmiş olabilir: aynı işlemde yeniden doğrula. */
    validateApplication(input,this.getSettings());
    const duplicate=this.sql.exec('SELECT id,reference FROM applications WHERE request_id=?',requestId).toArray()[0];if(duplicate){reference=duplicate.reference;return}
    const code=cityCode(data.city),last=this.sql.exec('SELECT max(CAST(substr(reference,8) AS INTEGER)) AS value FROM applications WHERE city=? AND reference LIKE ?',data.city,'01-'+code+'-%').one().value||0;reference='01-'+code+'-'+String(last+1).padStart(3,'0');
    this.sql.exec('INSERT INTO applications(id,request_id,reference,created_at,name,city,status,payment,data,receipt) VALUES(?,?,?,?,?,?,?,?,?,?)',id,requestId,reference,createdAt,data.candidate.firstName+' '+data.candidate.lastName,data.city,'yeni',data.paid?'beyan-edildi':'odenmedi',JSON.stringify(data),bytes?1:0);
    if(bytes)for(let part=0,offset=0;offset<bytes.length;part++,offset+=65536)this.sql.exec('INSERT INTO receipts(application_id,part,data) VALUES(?,?,?)',id,part,bytes.slice(offset,offset+65536).buffer);
   });
   return reply({id:this.sql.exec('SELECT id FROM applications WHERE request_id=?',requestId).one().id,reference},201);
  }
  return reply({error:'İşlem bulunamadı.'},404);
 }
}
