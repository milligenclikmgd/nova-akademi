// The existing panel session protects writes; only the published video is public.
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const PART_SIZE = 65536;
const error = (message, status = 400) => { throw Object.assign(new Error(message), {status}); };
const json = data => new Response(JSON.stringify(data), {headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});

export function initializeSiteMedia(sql) {
  sql.exec('CREATE TABLE IF NOT EXISTS site_video (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
  sql.exec('CREATE TABLE IF NOT EXISTS site_video_parts (part INTEGER PRIMARY KEY, data BLOB NOT NULL)');
  sql.exec('CREATE TABLE IF NOT EXISTS cms_media (id TEXT PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)');
  sql.exec('CREATE TABLE IF NOT EXISTS cms_media_parts (media_id TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(media_id,part))');
}

export async function saveCMSMedia(request,store){
  const limit=MAX_VIDEO_BYTES,declared=Number(request.headers.get('Content-Length')||0);if(declared>limit)error('Dosya en fazla 25 MB olabilir.',413);
  const type=(request.headers.get('Content-Type')||'').split(';')[0].toLowerCase(),reader=request.body?.getReader();if(!reader)error('Yüklenecek dosyayı seçin.');const parts=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();error('Dosya en fazla 25 MB olabilir.',413)}parts.push(value)}
  if(!size)error('Dosya boş olamaz.');const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
  const imageTypes=['image/jpeg','image/png','image/webp','image/gif'],videoTypes=['video/mp4','video/webm'];if(!imageTypes.includes(type)&&!videoTypes.includes(type))error('JPG, PNG, WebP, GIF, MP4 veya WebM dosyası yükleyin.');
  if(type.startsWith('image/')&&size>10*1024*1024)error('Görsel dosyaları en fazla 10 MB olabilir.',413);
  const head=bytes.subarray(0,12),ascii=new TextDecoder().decode(head);let valid=false;
  if(type==='image/jpeg')valid=head[0]===255&&head[1]===216&&head[2]===255;
  if(type==='image/png')valid=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
  if(type==='image/webp')valid=ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP';
  if(type==='image/gif')valid=ascii.startsWith('GIF87a')||ascii.startsWith('GIF89a');
  if(type==='video/mp4')valid=ascii.slice(4,8)==='ftyp';
  if(type==='video/webm')valid=head[0]===0x1a&&head[1]===0x45&&head[2]===0xdf&&head[3]===0xa3;
  if(!valid)error('Dosya içeriği seçilen medya türüyle eşleşmiyor.');
  const id=crypto.randomUUID(),rawName=new URL(request.url).searchParams.get('name')||'NOVA medya',name=rawName.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,150),createdAt=new Date().toISOString();
  store.ctx.storage.transactionSync(()=>{store.sql.exec('INSERT INTO cms_media(id,type,name,size,created_at) VALUES(?,?,?,?,?)',id,type,name,size,createdAt);for(let part=0,start=0;start<size;part++,start+=PART_SIZE)store.sql.exec('INSERT INTO cms_media_parts(media_id,part,data) VALUES(?,?,?)',id,part,bytes.slice(start,start+PART_SIZE).buffer)});
  return json({url:'/api/site-media/cms/'+id,type,name,size,createdAt});
}

export function serveCMSMedia(request,sql,id){const record=sql.exec('SELECT type,size FROM cms_media WHERE id=?',id).toArray()[0];if(!record)return new Response(null,{status:404});const headers={'Content-Type':record.type,'Content-Length':String(record.size),'Accept-Ranges':'bytes','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"};let start=0,end=record.size-1,status=200;const range=request.headers.get('Range');if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+record.size}});if(!match[1])start=Math.max(0,record.size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]))}if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=record.size||(!match[1]&&Number(match[2])===0))return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+record.size}});status=206;headers['Content-Range']=`bytes ${start}-${end}/${record.size}`;headers['Content-Length']=String(end-start+1)}if(request.method==='HEAD')return new Response(null,{status,headers});const first=Math.floor(start/PART_SIZE),last=Math.floor(end/PART_SIZE),rows=sql.exec('SELECT part,data FROM cms_media_parts WHERE media_id=? AND part>=? AND part<=? ORDER BY part',id,first,last).toArray(),chunks=rows.map(({part,data})=>new Uint8Array(data).subarray(Math.max(0,start-part*PART_SIZE),Math.min(data.byteLength,end-part*PART_SIZE+1)));return new Response(new Blob(chunks,{type:record.type}),{status,headers})}

function metadata(sql) {
  const row = sql.exec('SELECT data FROM site_video WHERE id=1').toArray()[0];
  return row ? JSON.parse(row.data) : null;
}

export function videoSettings(sql) {
  const video = metadata(sql);
  return {video: video ? {...video, url:'/api/site-media/activity-video/file?v='+video.revision} : null};
}

async function readVideo(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_VIDEO_BYTES) error('Video en fazla 25 MB olabilir.', 413);
  const reader = request.body?.getReader();
  if (!reader) error('Bir video dosyası seçin.');
  const chunks = []; let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_VIDEO_BYTES) { await reader.cancel(); error('Video en fazla 25 MB olabilir.', 413); }
    chunks.push(value);
  }
  if (size < 16) error('Geçerli bir MP4 veya WebM video seçin.');
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const type = (request.headers.get('Content-Type') || '').split(';')[0];
  const mp4 = new TextDecoder().decode(bytes.subarray(4, 8)) === 'ftyp';
  const webm = bytes[0]===0x1a && bytes[1]===0x45 && bytes[2]===0xdf && bytes[3]===0xa3;
  if (!((type==='video/mp4' && mp4) || (type==='video/webm' && webm))) error('Geçerli bir MP4 veya WebM video seçin.');
  return {bytes, type};
}

export async function saveActivityVideo(request, store) {
  const {bytes, type} = await readVideo(request);
  const rawName = new URL(request.url).searchParams.get('name') || 'Faaliyet videosu';
  const name = rawName.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 160);
  const video = {name, type, size:bytes.byteLength, revision:crypto.randomUUID(), updatedAt:new Date().toISOString()};
  store.ctx.storage.transactionSync(() => {
    store.sql.exec('DELETE FROM site_video_parts');
    for (let part=0, offset=0; offset<bytes.length; part++, offset+=PART_SIZE) {
      store.sql.exec('INSERT INTO site_video_parts(part,data) VALUES(?,?)', part, bytes.slice(offset, offset+PART_SIZE).buffer);
    }
    store.sql.exec('INSERT INTO site_video(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data', JSON.stringify(video));
  });
  return json(videoSettings(store.sql));
}

export function removeActivityVideo(store) {
  store.ctx.storage.transactionSync(() => {store.sql.exec('DELETE FROM site_video_parts');store.sql.exec('DELETE FROM site_video');});
  return json({video:null});
}

export function serveActivityVideo(request, sql) {
  const video = metadata(sql);
  if (!video) return new Response(null, {status:404});
  const revision = new URL(request.url).searchParams.get('v');
  if (revision && revision !== video.revision) return new Response(null, {status:404,headers:{'Cache-Control':'no-store'}});
  const headers = {'Content-Type':video.type,'Accept-Ranges':'bytes','Cache-Control':'no-cache','ETag':'"'+video.revision+'"','X-Content-Type-Options':'nosniff'};
  let start=0, end=video.size-1, status=200;
  const range = request.headers.get('Range');
  if (range && (!request.headers.has('If-Range') || request.headers.get('If-Range')===headers.ETag)) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+video.size}});
    if (!match[1]) start=Math.max(0,video.size-Number(match[2]));
    else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start>end || start>=video.size || (!match[1]&&Number(match[2])===0)) return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+video.size}});
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${video.size}`;
  }
  headers['Content-Length']=String(end-start+1);
  if(request.method==='HEAD')return new Response(null,{status,headers});
  const parts=sql.exec('SELECT part,data FROM site_video_parts WHERE part>=? AND part<=? ORDER BY part',Math.floor(start/PART_SIZE),Math.floor(end/PART_SIZE)).toArray();
  const chunks=parts.map(({part,data}) => new Uint8Array(data).subarray(Math.max(0,start-part*PART_SIZE),Math.min(data.byteLength,end-part*PART_SIZE+1)));
  return new Response(new Blob(chunks,{type:video.type}),{status,headers});
}
