<?php
declare(strict_types=1);
require dirname(__DIR__).'/includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function proxy_reply(array $data,int $status=200):never{http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
if(empty($_SESSION['admin']))proxy_reply(['error'=>'cPanel yönetici oturumunuz sona erdi. Panelden tekrar giriş yapın.'],401);
function verify_proxy_csrf():void{$given=(string)($_SERVER['HTTP_X_CSRF_TOKEN']??'');if(!$given||!hash_equals(csrf(),$given))proxy_reply(['error'=>'Oturum doğrulaması başarısız. Sayfayı yenileyin.'],403);}
function worker_auth_key():string{global $config;$secret=(string)($config['db']['pass']??'');if($secret==='')throw new RuntimeException('Sunucu anahtarı yapılandırılmamış.');return hash('sha256','NOVA_WORKER_SESSION_V1|'.$secret,true);}
function ensure_worker_auth_table():void{global $pdo;$pdo->exec("CREATE TABLE IF NOT EXISTS nova_worker_auth (admin_id INT UNSIGNED NOT NULL PRIMARY KEY,token_cipher MEDIUMBLOB NOT NULL,token_iv BINARY(12) NOT NULL,token_tag BINARY(16) NOT NULL,expires_at DATETIME NOT NULL,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");}
function save_worker_cookie(string $cookie,int $lifetime):void{
 global $pdo;$lifetime=max(60,min($lifetime,2592000));if(!preg_match('/^__Host-nova-panel=[A-Za-z0-9-]{32,100}$/',$cookie))throw new RuntimeException('Sınav oturumu biçimi doğrulanamadı.');
 if(!function_exists('openssl_encrypt'))throw new RuntimeException('Sunucuda OpenSSL etkin olmadığı için kalıcı oturum kurulamadı.');
 ensure_worker_auth_table();$iv=random_bytes(12);$tag='';$cipher=openssl_encrypt($cookie,'aes-256-gcm',worker_auth_key(),OPENSSL_RAW_DATA,$iv,$tag);if($cipher===false)throw new RuntimeException('Sınav oturumu şifrelenemedi.');
 $expires=(new DateTimeImmutable('now',new DateTimeZone('UTC')))->modify('+'.$lifetime.' seconds')->format('Y-m-d H:i:s');
 $stmt=$pdo->prepare('INSERT INTO nova_worker_auth(admin_id,token_cipher,token_iv,token_tag,expires_at) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE token_cipher=VALUES(token_cipher),token_iv=VALUES(token_iv),token_tag=VALUES(token_tag),expires_at=VALUES(expires_at)');$stmt->execute([(int)$_SESSION['admin'],$cipher,$iv,$tag,$expires]);
}
function load_worker_cookie():string{
 global $pdo;ensure_worker_auth_table();$id=(int)$_SESSION['admin'];$stmt=$pdo->prepare('SELECT token_cipher,token_iv,token_tag,expires_at FROM nova_worker_auth WHERE admin_id=?');$stmt->execute([$id]);$row=$stmt->fetch();
 if(!$row)return '';
 if(strtotime($row['expires_at'].' UTC')<=time()){$delete=$pdo->prepare('DELETE FROM nova_worker_auth WHERE admin_id=?');$delete->execute([$id]);unset($_SESSION['worker_panel_cookie']);return '';}
 if(!function_exists('openssl_decrypt'))return '';
 $plain=openssl_decrypt($row['token_cipher'],'aes-256-gcm',worker_auth_key(),OPENSSL_RAW_DATA,$row['token_iv'],$row['token_tag']);if(!is_string($plain)||!preg_match('/^__Host-nova-panel=[A-Za-z0-9-]{32,100}$/',$plain))return '';
 return $plain;
}
function clear_worker_cookie():void{global $pdo;unset($_SESSION['worker_panel_cookie']);try{ensure_worker_auth_table();$stmt=$pdo->prepare('DELETE FROM nova_worker_auth WHERE admin_id=?');$stmt->execute([(int)($_SESSION['admin']??0)]);}catch(Throwable $error){}}
function current_worker_cookie():string{
 $legacy=(string)($_SESSION['worker_panel_cookie']??'');
 try{
  $cookie=load_worker_cookie();
  if($cookie!==''){$_SESSION['worker_panel_cookie']=$cookie;return $cookie;}
  if($legacy!==''&&isset($_SESSION['worker_panel_cookie'])){save_worker_cookie($legacy,8*60*60);return $legacy;}
 }catch(Throwable $error){if($legacy!=='')return $legacy;}
 return '';
}
function worker_request(string $path,string $method,string $body=''):array{
 if(!function_exists('curl_init'))return [['error'=>'Sunucuda cURL etkin değil. Hosting desteğinden PHP cURL modülünü açtırın.'],503,''];
 $base='https://nova-akademi.milligenclikmgd.workers.dev';$url=$base.$path;$headers=['Accept: application/json','Origin: '.$base];$cookie=current_worker_cookie();if($cookie!=='')$headers[]='Cookie: '.$cookie;
 if($method!=='GET')$headers[]='Content-Type: application/json';
 $ch=curl_init($url);$opts=[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HEADER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_FOLLOWLOCATION=>false];
 if($method!=='GET'){$opts[CURLOPT_CUSTOMREQUEST]=$method;if($body!=='')$opts[CURLOPT_POSTFIELDS]=$body;}
 curl_setopt_array($ch,$opts);$raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$headerSize=(int)curl_getinfo($ch,CURLINFO_HEADER_SIZE);$error=curl_error($ch);curl_close($ch);
 if($raw===false)return [['error'=>'Sınav servisine bağlanılamadı: '.$error],502,''];
 $head=substr($raw,0,$headerSize);$payload=substr($raw,$headerSize);$json=json_decode($payload,true);if(!is_array($json))$json=['error'=>'Sınav servisinden geçersiz yanıt alındı.'];
 return [$json,$status,$head];
}
function worker_download(string $path):array{
 if(!function_exists('curl_init'))return ['',503,'','Sunucuda cURL etkin değil.'];
 $base='https://nova-akademi.milligenclikmgd.workers.dev';$headers=['Accept: application/pdf, image/jpeg, image/png, image/webp','Origin: '.$base];$cookie=current_worker_cookie();if($cookie!=='')$headers[]='Cookie: '.$cookie;
 $ch=curl_init($base.$path);curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HEADER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>45,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_FOLLOWLOCATION=>false]);
 $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$headerSize=(int)curl_getinfo($ch,CURLINFO_HEADER_SIZE);$error=curl_error($ch);curl_close($ch);
 if($raw===false)return ['',502,'',$error];
 return [substr($raw,$headerSize),$status,substr($raw,0,$headerSize),''];
}

if($_SERVER['REQUEST_METHOD']==='POST'&&isset($_GET['connect'])){
 verify_proxy_csrf();$input=json_decode((string)file_get_contents('php://input'),true);$password=$input['password']??'';
 if(!is_string($password)||$password===''||strlen($password)>256)proxy_reply(['error'=>'Sınav servisi parolasını girin.'],400);
 [$data,$status,$head]=worker_request('/api/panel/login','POST',json_encode(['password'=>$password],JSON_UNESCAPED_UNICODE));
 if($status<200||$status>=300)proxy_reply($data,$status?:502);
 if(!preg_match('/^Set-Cookie:\\s*(__Host-nova-panel=[^;]+)/mi',$head,$match))proxy_reply(['error'=>'Sınav servisi oturum çerezi alınamadı.'],502);
 $lifetime=2592000;if(preg_match('/^Set-Cookie:\\s*__Host-nova-panel=[^;]+;[^\\r\\n]*?Max-Age=(\\d+)/mi',$head,$ageMatch))$lifetime=(int)$ageMatch[1];
 try{save_worker_cookie($match[1],$lifetime);}catch(Throwable $error){proxy_reply(['error'=>'Sınav bağlantısı kuruldu ancak cPanel sunucusunda kalıcı oturum kaydedilemedi: '.$error->getMessage()],500);}
 $_SESSION['worker_panel_cookie']=$match[1];proxy_reply(['ok'=>true,'message'=>'Sınav servisine güvenli ve kalıcı bağlantı kuruldu.']);
}

$rawPath=(string)($_GET['path']??'');$parsed=parse_url($rawPath);$path=(string)($parsed['path']??'');$query=(string)($parsed['query']??'');$target=$path.($query!==''?'?'.$query:'');
$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??''));
$appDetail=preg_match('~^/api/panel/applications/[a-f0-9-]{36}(?:/(?:receipt|registration-payment-receipt))?$~',$path)===1;
$allowed=($method==='GET'&&in_array($path,['/api/panel/session','/api/panel/settings','/api/panel/exam-sessions','/api/panel/applications/summary','/api/panel/applications'],true))
 ||($method==='GET'&&$appDetail)
 ||($method==='PUT'&&$path==='/api/panel/settings')
 ||($method==='POST'&&in_array($path,['/api/panel/exam-sessions','/api/panel/exam-sessions/bulk-delete','/api/panel/applications/reset'],true))
 ||(in_array($method,['PATCH','DELETE'],true)&&preg_match('~^/api/panel/exam-sessions/[a-f0-9-]{36}$~',$path)===1)
 ||($method==='PATCH'&&preg_match('~^/api/panel/applications/[a-f0-9-]{36}$~',$path)===1);
if(!$allowed)proxy_reply(['error'=>'Bu panel isteğine izin verilmiyor.'],404);
if($method!=='GET')verify_proxy_csrf();
if(current_worker_cookie()==='')proxy_reply(['error'=>'Sınav servisine bir defa bağlanın. Oturumunuz yok veya süresi dolmuş.'],401);
if($method==='GET'&&preg_match('~^/api/panel/applications/[a-f0-9-]{36}/(?:receipt|registration-payment-receipt)$~',$path)){
 [$payload,$status,$head,$error]=worker_download($target);
 if($status===401)clear_worker_cookie();
 if($error!=='')proxy_reply(['error'=>'Dekont servisine bağlanılamadı.'],502);
 if($status<200||$status>=300){$json=json_decode($payload,true);proxy_reply(is_array($json)?$json:['error'=>'Dekont bulunamadı.'],$status?:404);}
 preg_match('/^Content-Type:\\s*([^;\\r\\n]+)/mi',$head,$typeMatch);$type=strtolower(trim($typeMatch[1]??'application/octet-stream'));$allowedTypes=['application/pdf','image/jpeg','image/png','image/webp'];if(!in_array($type,$allowedTypes,true))$type='application/octet-stream';
 header('Content-Type: '.$type);header('Content-Disposition: inline; filename="nova-dekont"');header('Content-Security-Policy: sandbox');echo $payload;exit;
}
$body='';if(!in_array($method,['GET','DELETE'],true)){$body=(string)file_get_contents('php://input');if(strlen($body)>300000)proxy_reply(['error'=>'İstek boyutu sınırı aşıldı.'],413);}
[$data,$status]=worker_request($target,$method,$body);if($status===401)clear_worker_cookie();proxy_reply($data,$status?:502);
