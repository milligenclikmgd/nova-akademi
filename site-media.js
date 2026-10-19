// The existing panel session protects writes; only the published video is public.
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const PART_SIZE = 65536;
const error = (message, status = 400) => { throw Object.assign(new Error(message), {status}); };
const json = data => new Response(JSON.stringify(data), {headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});

export function initializeSiteMedia(sql) {
  sql.exec('CREATE TABLE IF NOT EXISTS site_video (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
  sql.exec('CREATE TABLE IF NOT EXISTS site_video_parts (part INTEGER PRIMARY KEY, data BLOB NOT NULL)');
}

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
