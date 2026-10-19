const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const base = process.env.NOVA_TEST_URL || 'http://127.0.0.1:8788';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw Error('Tests must use a local isolated server');
const source = readFileSync(join(__dirname,'../assets/activity-intro.mp4'));
let cookie;
const endpoint = '/api/panel/activity-video';
async function upload(body=source, type='video/mp4', origin=base, authenticated=true) {
  return fetch(base+endpoint+'?name='+encodeURIComponent('Faaliyet tanıtım.mp4'), {method:'PUT',headers:{Origin:origin,'Content-Type':type,...(authenticated?{Cookie:cookie}:{})},body});
}
async function config() {const res=await fetch(base+'/api/site-media/activity-video');assert.equal(res.status,200);return res.json();}
(async()=>{
  assert.equal((await upload(source,'video/mp4',base,false)).status,401);
  const login=await fetch(base+'/api/panel/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.241'},body:JSON.stringify({password:'nova-local-integration-only-2026'})});
  assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
  const reset=()=>fetch(base+endpoint,{method:'DELETE',headers:{Origin:base,Cookie:cookie}});
  await reset();assert.equal((await config()).video,null);
  assert.equal((await upload(source,'video/mp4','https://wrong.example')).status,403);
  let res=await upload();assert.equal(res.status,200);const {video}=await res.json();assert.equal(video.name,'Faaliyet tanıtım.mp4');assert.equal(video.size,source.length);
  assert.deepEqual((await config()).video,video);
  res=await fetch(base+video.url);assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'video/mp4');assert.deepEqual(Buffer.from(await res.arrayBuffer()),source);
  for (const [range,start,end] of [['bytes=0-15',0,15],['bytes=65530-65550',65530,65550],['bytes=-32',source.length-32,source.length-1],['bytes='+Math.floor(source.length/2)+'-',Math.floor(source.length/2),source.length-1]]) {
    res=await fetch(base+video.url,{headers:{Range:range}});assert.equal(res.status,206);assert.equal(res.headers.get('content-range'),`bytes ${start}-${end}/${source.length}`);assert.deepEqual(Buffer.from(await res.arrayBuffer()),source.subarray(start,end+1));
  }
  for(const range of ['bytes=9999999-','bytes=10-2','bytes=-0','bytes=0-1,4-5'])assert.equal((await fetch(base+video.url,{headers:{Range:range}})).status,416);
  res=await fetch(base+video.url,{method:'HEAD'});assert.equal(res.status,200);assert.equal(res.headers.get('content-length'),String(source.length));assert.equal((await res.arrayBuffer()).byteLength,0);
  assert.equal((await upload(Buffer.from('not a valid video at all'))).status,400);
  assert.equal((await upload(source,'text/html')).status,400);
  assert.equal((await upload(Buffer.alloc(25*1024*1024+1))).status,413);
  assert.equal((await config()).video.revision,video.revision);
  res=await upload();assert.equal(res.status,200);const replacement=(await res.json()).video;assert.notEqual(replacement.revision,video.revision);
  assert.equal((await fetch(base+video.url)).status,404);
  const cors=await fetch(base+'/api/site-media/activity-video',{headers:{Origin:'https://nova-akademi.vercel.app'}});assert.equal(cors.headers.get('access-control-allow-origin'),'https://nova-akademi.vercel.app');
  assert.equal((await fetch(base+replacement.url,{headers:{Range:'bytes=0-9','If-Range':'"old"'}})).status,200);
  assert.equal((await reset()).status,200);assert.equal((await config()).video,null);assert.equal((await fetch(base+replacement.url)).status,404);
  console.log('Site media integration passed: session, origin, upload, persistence, replacement, size/type validation, byte ranges, HEAD, CORS, reset.');
})().catch(error=>{console.error(error);process.exitCode=1});
