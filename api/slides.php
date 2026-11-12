<?php
declare(strict_types=1);
require dirname(__DIR__).'/includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$rows=$pdo->query('SELECT id,media_type,image_url,video_url,alt_text,sort_order FROM slides WHERE is_published=1 ORDER BY sort_order,id')->fetchAll();
echo json_encode(['slides'=>array_map(static fn($s)=>['id'=>$s['id'],'mediaType'=>$s['media_type'],'image'=>$s['image_url'],'video'=>$s['video_url'],'alt'=>$s['alt_text'],'published'=>true,'hotspot'=>['enabled'=>false]],$rows)],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
