<?php
declare(strict_types=1);
session_name('nova_panel');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','httponly'=>true,'secure'=>(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')||($_SERVER['HTTP_X_FORWARDED_PROTO']??'')==='https','samesite'=>'Lax']);
session_start();
$config=require dirname(__DIR__).'/config.php';
$db=$config['db'];
$pdo=new PDO('mysql:host='.$db['host'].';dbname='.$db['name'].';charset='.($db['charset']??'utf8mb4'),$db['user'],$db['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
function ensure_slide_schema(PDO $pdo):void{
 $columns=array_column($pdo->query('SHOW COLUMNS FROM slides')->fetchAll(PDO::FETCH_ASSOC),'Field');
 $definitions=[
  'device'=>"VARCHAR(10) NOT NULL DEFAULT 'desktop'",
  'title'=>"VARCHAR(180) NOT NULL DEFAULT ''",
  'title_color'=>"VARCHAR(7) NOT NULL DEFAULT '#ffffff'",
  'subtitle'=>"VARCHAR(500) NOT NULL DEFAULT ''",
  'subtitle_color'=>"VARCHAR(7) NOT NULL DEFAULT '#ffffff'",
  'link_url'=>"VARCHAR(2048) NOT NULL DEFAULT ''",
  'hotspot_enabled'=>"TINYINT(1) NOT NULL DEFAULT 0",
  'hotspot_x'=>"DECIMAL(5,2) NOT NULL DEFAULT 10",
  'hotspot_y'=>"DECIMAL(5,2) NOT NULL DEFAULT 70",
  'hotspot_width'=>"DECIMAL(5,2) NOT NULL DEFAULT 28",
  'hotspot_height'=>"DECIMAL(5,2) NOT NULL DEFAULT 18"
 ];
 foreach($definitions as $name=>$definition)if(!in_array($name,$columns,true)){$pdo->exec("ALTER TABLE slides ADD COLUMN ".$name." ".$definition);$columns[]=$name;}
}
function e(?string $value):string{return htmlspecialchars($value??'',ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function csrf():string{return $_SESSION['csrf']??=bin2hex(random_bytes(32));}
function guard():void{if(empty($_SESSION['admin'])){header('Location: /panel/');exit;}}
function check_csrf():void{if(!hash_equals(csrf(),(string)($_POST['csrf']??''))){http_response_code(403);exit('Geçersiz oturum.');}}
function redirect(string $message=''):never{$_SESSION['flash']=$message;header('Location: /panel/');exit;}
