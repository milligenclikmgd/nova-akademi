<?php
declare(strict_types=1);
session_name('nova_panel');
session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']),'samesite'=>'Lax']);
session_start();
$config=require dirname(__DIR__).'/config.php';
$db=$config['db'];
$pdo=new PDO('mysql:host='.$db['host'].';dbname='.$db['name'].';charset='.($db['charset']??'utf8mb4'),$db['user'],$db['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
function e(?string $value):string{return htmlspecialchars($value??'',ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function csrf():string{return $_SESSION['csrf']??=bin2hex(random_bytes(32));}
function guard():void{if(empty($_SESSION['admin'])){header('Location: /panel/');exit;}}
function check_csrf():void{if(!hash_equals(csrf(),(string)($_POST['csrf']??''))){http_response_code(403);exit('Geçersiz oturum.');}}
function redirect(string $message=''):never{$_SESSION['flash']=$message;header('Location: /panel/');exit;}
