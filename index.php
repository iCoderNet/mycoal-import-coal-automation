<?php
// CORS ruxsatlari
header("Access-Control-Allow-Origin: *"); // Agar faqat bitta domen bo'lsa, * o'rniga domeningizni yozing: https://mydomain.com
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// OPTIONS preflight so'rovga javob
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


$file = __DIR__ . '/code.json';

// GET=code bo'lsa
if (isset($_GET['get']) && $_GET['get'] === 'code') {
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        $data['requested'] = ($data['requested'] ?? 0) + 1;
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Code not found"]);
    }
    exit;
}

// SMSni qabul qilish
$msg  = $_REQUEST['msg']  ?? '';
$time = $_REQUEST['time'] ?? date('Y-m-d H:i:s');

// OTP kodni faqat <#> ichidan olish
$code = '';
if (preg_match('/<#>\s*(\d{4,6})\s*-/u', $msg, $matches)) {
    $code = $matches[1];
}

if ($code) {
    $data = [
        'code' => $code,
        'requested' => 0,
        'time' => $time
    ];
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Log uchun yozib borish
file_put_contents(__DIR__.'/log.txt', date('Y-m-d H:i:s') . " - " . $msg . " - " . $time . "\n", FILE_APPEND);

echo json_encode(["status" => "ok", "saved_code" => $code]);
