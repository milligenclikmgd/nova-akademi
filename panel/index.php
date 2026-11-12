<?php
require dirname(__DIR__).'/includes/bootstrap.php';
$pdo->exec("CREATE TABLE IF NOT EXISTS nova_admins (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,username VARCHAR(100) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
if($_SERVER['REQUEST_METHOD']==='POST'){
 check_csrf();
 if(isset($_POST['setup'])){
  if((int)$pdo->query('SELECT COUNT(*) FROM nova_admins')->fetchColumn()!==0)redirect('Kurulum tamamlanmış.');
  $pass=(string)($_POST['password']??'');
  if(strlen($pass)<12)redirect('Şifre en az 12 karakter olmalı.');
  $stmt=$pdo->prepare('INSERT INTO nova_admins(username,password_hash) VALUES(?,?)');
  $stmt->execute([trim((string)$_POST['username']),password_hash($pass,PASSWORD_DEFAULT)]);
  redirect('Yönetici oluşturuldu, giriş yapın.');
 }
 if(isset($_POST['login'])){
  $stmt=$pdo->prepare('SELECT * FROM nova_admins WHERE username=?');
  $stmt->execute([trim((string)($_POST['username']??''))]);$admin=$stmt->fetch();
  if($admin&&password_verify((string)($_POST['password']??''),$admin['password_hash'])){session_regenerate_id(true);$_SESSION['admin']=$admin['id'];header('Location: /panel/dashboard.php');exit;}
  redirect('Giriş bilgileri hatalı.');
 }
 guard();
 if(isset($_POST['logout'])){try{$workerAuth=$pdo->prepare('DELETE FROM nova_worker_auth WHERE admin_id=?');$workerAuth->execute([(int)$_SESSION['admin']]);}catch(Throwable $error){}$_SESSION=[];session_destroy();header('Location: /panel/');exit;}
 if(isset($_POST['delete'])){$stmt=$pdo->prepare('DELETE FROM slides WHERE id=?');$stmt->execute([(int)$_POST['delete']]);header('Location: /panel/dashboard.php?section=slider');exit;}
 if(isset($_POST['save'])){
  $type=(string)($_POST['media_type']??'image');if(!in_array($type,['image','video'],true))redirect('Medya türü geçersiz.');
  $id=(int)($_POST['id']??0);$existing=null;
  if($id){$stmt=$pdo->prepare('SELECT * FROM slides WHERE id=?');$stmt->execute([$id]);$existing=$stmt->fetch();if(!$existing)redirect('Kayıt bulunamadı.');}
  $field=$type==='video'?'video_url':'image_url';$url=$existing[$field]??null;
  if(!empty($_FILES['media']['name'])){
   $file=$_FILES['media'];if($file['error']!==UPLOAD_ERR_OK||$file['size']>150*1024*1024)redirect('Dosya yüklenemedi veya 150 MB sınırını aştı.');
   $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
   $allowed=$type==='video'?['video/mp4'=>'mp4','video/webm'=>'webm']:['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
   if(!isset($allowed[$mime]))redirect('Dosya türü desteklenmiyor.');
   $dir=dirname(__DIR__).'/uploads';if(!is_dir($dir))mkdir($dir,0755,true);
   $name=bin2hex(random_bytes(16)).'.'.$allowed[$mime];
   if(!move_uploaded_file($file['tmp_name'],$dir.'/'.$name))redirect('Dosya kaydedilemedi.');
   $url='/uploads/'.$name;
  }
  if(!$url)redirect('Görsel veya video seçin.');
  $alt=mb_substr(trim((string)($_POST['alt_text']??'')),0,300);
  $order=(int)($_POST['sort_order']??0);$published=isset($_POST['is_published'])?1:0;
  if($id){$stmt=$pdo->prepare('UPDATE slides SET media_type=?,image_url=?,video_url=?,alt_text=?,sort_order=?,is_published=? WHERE id=?');$stmt->execute([$type,$type==='image'?$url:null,$type==='video'?$url:null,$alt,$order,$published,$id]);}
  else{$stmt=$pdo->prepare('INSERT INTO slides(media_type,image_url,video_url,alt_text,sort_order,is_published) VALUES(?,?,?,?,?,?)');$stmt->execute([$type,$type==='image'?$url:null,$type==='video'?$url:null,$alt,$order,$published]);}
  header('Location: /panel/dashboard.php?section=slider');exit;
 }
}
$flash=$_SESSION['flash']??'';unset($_SESSION['flash']);
$installed=(int)$pdo->query('SELECT COUNT(*) FROM nova_admins')->fetchColumn()>0;
$slides=!empty($_SESSION['admin'])?$pdo->query('SELECT * FROM slides ORDER BY sort_order,id')->fetchAll():[];
?><!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOVA Yönetim Paneli</title><style>body{margin:0;background:#f3f6fb;color:#102b4d;font:15px system-ui}main{max-width:1100px;margin:40px auto;padding:24px}header,.card{background:#fff;border:1px solid #dce5ef;border-radius:14px;padding:24px;margin-bottom:20px}h1{margin:0 0 8px}form{display:grid;gap:12px}input,select,button{font:inherit;padding:11px;border:1px solid #cedbea;border-radius:8px}button{background:#125cb2;color:#fff;cursor:pointer}.row{display:flex;gap:18px;align-items:center;border-top:1px solid #e1e9f2;padding:16px 0;flex-wrap:wrap}.row img,.row video{width:230px;max-height:110px;object-fit:contain}.row form{display:inline}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.flash{padding:12px;background:#e2f4ff;border-radius:8px}</style></head><body><main><header><h1>NOVA Yönetim Paneli</h1><p>cPanel üzerinde slider yönetimi</p></header><?php if($flash):?><p class="flash"><?=e($flash)?></p><?php endif;?><?php if(!$installed||empty($_SESSION['admin'])):?><section class="card"><h2><?=$installed?'Giriş yap':'İlk yönetici hesabını oluştur'?></h2><form method="post"><input type="hidden" name="csrf" value="<?=e(csrf())?>"><input name="username" placeholder="Kullanıcı adı" required autocomplete="username"><input name="password" type="password" placeholder="Şifre (en az 12 karakter)" required autocomplete="<?=$installed?'current-password':'new-password'?>"><button name="<?=$installed?'login':'setup'?>" value="1"><?=$installed?'Giriş yap':'Hesabı oluştur'?></button></form></section><?php else:?><section class="card"><form method="post"><input type="hidden" name="csrf" value="<?=e(csrf())?>"><button name="logout" value="1">Çıkış yap</button></form></section><section class="card"><h2>Slider ekle veya düzenle</h2><form method="post" enctype="multipart/form-data" id="editor"><input type="hidden" name="csrf" value="<?=e(csrf())?>"><input type="hidden" name="id" value=""><div class="grid"><label>Medya türü<select name="media_type" id="media-type"><option value="image">Görsel</option><option value="video">Video</option></select></label><label>Dosya<input type="file" name="media" id="media-file" accept="image/jpeg,image/png,image/webp"></label><label>Sıra<input name="sort_order" type="number" value="0"></label><label>Açıklama<input name="alt_text" maxlength="300"></label></div><label><input type="checkbox" name="is_published" checked> Yayında</label><button name="save" value="1">Kaydet</button></form></section><section class="card"><h2>Sliderlar</h2><?php foreach($slides as $s):?><div class="row"><?php if($s['media_type']==='video'):?><video controls preload="metadata" src="<?=e($s['video_url'])?>"></video><?php else:?><img src="<?=e($s['image_url'])?>" alt="<?=e($s['alt_text'])?>"><?php endif;?><span><?=e($s['alt_text'])?> · <?=e($s['media_type'])?> · <?=$s['is_published']?'Yayında':'Taslak'?></span><button type="button" onclick="editSlide(<?=e(json_encode($s,JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP))?>)">Düzenle</button><form method="post" onsubmit="return confirm('Slider silinsin mi?')"><input type="hidden" name="csrf" value="<?=e(csrf())?>"><button name="delete" value="<?=e((string)$s['id'])?>">Sil</button></form></div><?php endforeach;?></section><script>const form=document.querySelector('#editor'),type=form.querySelector('#media-type'),file=form.querySelector('#media-file');type.onchange=()=>file.accept=type.value==='video'?'video/mp4,video/webm':'image/jpeg,image/png,image/webp';function editSlide(s){form.elements['id'].value=s.id;type.value=s.media_type;type.onchange();form.sort_order.value=s.sort_order;form.alt_text.value=s.alt_text;form.is_published.checked=!!Number(s.is_published);form.scrollIntoView({behavior:'smooth'})}</script><?php endif;?></main></body></html>
