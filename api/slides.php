<?php
declare(strict_types=1);
require dirname(__DIR__).'/includes/bootstrap.php';
ensure_slide_schema($pdo);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$rows=$pdo->query('SELECT * FROM slides WHERE is_published=1 ORDER BY device,sort_order,id')->fetchAll();
$map=static function(array $s):array{return [
'id'=>(string)$s['id'],'device'=>$s['device'],'mediaType'=>$s['media_type'],'image'=>$s['image_url']??'','video'=>$s['video_url']??'','alt'=>$s['alt_text']??'','title'=>$s['title']??'','titleColor'=>$s['title_color']??'#ffffff','subtitle'=>$s['subtitle']??'','subtitleColor'=>$s['subtitle_color']??'#ffffff','published'=>(bool)$s['is_published'],'link'=>$s['link_url']??'','hotspot'=>['enabled'=>(bool)($s['hotspot_enabled']??false),'x'=>(float)($s['hotspot_x']??10),'y'=>(float)($s['hotspot_y']??70),'width'=>(float)($s['hotspot_width']??28),'height'=>(float)($s['hotspot_height']??18)]
];};
$desktop=[];$mobile=[];foreach($rows as $row){$item=$map($row);if($row['device']==='mobile')$mobile[]=$item;else $desktop[]=$item;}
echo json_encode(['slides'=>$desktop,'mobileSlides'=>$mobile],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
