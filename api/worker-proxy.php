<?php
declare(strict_types=1);
require dirname(__DIR__).'/includes/bootstrap.php';
guard();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function proxy_reply(array $data,int $status=200):never{http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function verify_proxy_csrf():void{$given=(string)($_SERVER['HTTP_X_CSRF_TOKEN']??'');if(!$given||!hash_equals(csrf(),$given))proxy_reply(['error'=>'Oturum doğrulaması başarısız. Sayfayı yenileyin.'],403);}
function worker_request(string $path,string $method,string $body=''):array{
 if(!function_exists('curl_init'))return [['error'=>'Sunucuda cURL etkin değil. Hosting desteğinden PHP cURL modülünü açtırın.'],503,''];
 $base='https://nova-akademi.milligenclikmgd.workers.dev';$url=$base.$path;$headers=['Accept: application/json','Origin: '.$base];
 if($method!=='GET')$headers[]='Content-Type: application/json';
 if(!empty($_SESSION['worker_panel_cookie']))$headers[]='Cookie: '.$_SESSION['worker_panel_cookie'];
 $ch=curl_init($url);$opts=[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HEADER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_FOLLOWLOCATION=>false];
 if($method!=='GET'){$opts[CURLOPT_CUSTOMREQUEST]=$method;if($body!=='')$opts[CURLOPT_POSTFIELDS]=$body;}
 curl_setopt_array($ch,$opts);$raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$headerSize=(int)curl_getinfo($ch,CURLINFO_HEADER_SIZE);$error=curl_error($ch);curl_close($ch);
 if($raw===false)return [['error'=>'Sınav servisine bağlanılamadı: '.$error],502,''];
 $head=substr($raw,0,$headerSize);$payload=substr($raw,$headerSize);$json=json_decode($payload,true);if(!is_array($json))$json=['error'=>'Sınav servisinden geçersiz yanıt alındı.'];
 return [$json,$status,$head];
}

if($_SERVER['REQUEST_METHOD']==='POST'&&isset($_GET['connect'])){
 verify_proxy_csrf();$input=json_decode((string)file_get_contents('php://input'),true);$password=$input['password']??'';
 if(!is_string($password)||$password===''||strlen($password)>256)proxy_reply(['error'=>'Sınav servisi parolasını girin.'],400);
 [$data,$status,$head]=worker_request('/api/panel/login','POST',json_encode(['password'=>$password],JSON_UNESCAPED_UNICODE));
 if($status<200||$status>=300){proxy_reply($data,$status?:502);}
 if(!preg_match('/^Set-Cookie:\s*(__Host-nova-panel=[^;]+)/mi',$head,$match))proxy_reply(['error'=>'Sınav servisi oturum çerezi alınamadı.'],502);
 $_SESSION['worker_panel_cookie']=$match[1];session_regenerate_id(true);proxy_reply(['ok'=>true,'message'=>'Sınav servisine bağlandı.']);
}

$path=(string)($_GET['path']??'');$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));
$allowed=($method==='GET'&&in_array($path,['/api/panel/session','/api/panel/settings','/api/panel/exam-sessions','/api/panel/applications/summary'],true))
 ||($method==='PUT'&&$path==='/api/panel/settings')
 ||($method==='POST'&&in_array($path,['/api/panel/exam-sessions','/api/panel/exam-sessions/bulk-delete'],true))
 ||(in_array($method,['PATCH','DELETE'],true)&&preg_match('~^/api/panel/exam-sessions/[a-f0-9-]{36}$~',$path)===1);
if(!$allowed)proxy_reply(['error'=>'Bu panel isteğine izin verilmiyor.'],404);
if($method!=='GET')verify_proxy_csrf();
if(empty($_SESSION['worker_panel_cookie']))proxy_reply(['error'=>'Sınav servisine bağlanın.'],401);
$body='';if(!in_array($method,['GET','DELETE'],true)){$body=(string)file_get_contents('php://input');if(strlen($body)>300000)proxy_reply(['error'=>'İstek boyutu sınırı aşıldı.'],413);}
[$data,$status]=worker_request($path,$method,$body);if($status===401)unset($_SESSION['worker_panel_cookie']);proxy_reply($data,$status?:502);
