<?php
declare(strict_types=1);

/*
 * Publishes the JSON edited in the browser as /menue/menu.json.
 * Publishing is protected by a separate secret stored in .publish-secret.php.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function answer(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function valid_card(mixed $card): bool {
    if (!is_array($card)) return false;
    if (isset($card['sections']) && !is_array($card['sections'])) return false;
    foreach (($card['sections'] ?? []) as $section) {
        if (!is_array($section) || (isset($section['items']) && !is_array($section['items']))) return false;
        foreach (($section['items'] ?? []) as $item) {
            if (!is_array($item)) return false;
            if (isset($item['price']) && $item['price'] !== null && !is_numeric($item['price'])) return false;
        }
    }

    /* Background names are used in CSS url(...); allow only a local image file. */
    if (isset($card['hintergrund'])) {
        $background = $card['hintergrund'];
        if (!is_string($background) || !preg_match('/^[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i', $background)) return false;
        if (!is_file(__DIR__ . '/bilder/' . $background)) return false;
    }

    /* The editor stores uploaded logos inline. Disallow remote or executable URLs. */
    if (isset($card['logo']) && $card['logo'] !== null && $card['logo'] !== '') {
        $logo = $card['logo'];
        $local = is_string($logo) && preg_match('/^bilder\/[A-Za-z0-9_.-]+\.(?:jpe?g|png|gif|webp)$/i', $logo);
        $inline = is_string($logo) && preg_match('/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+\/=]+$/i', $logo);
        if (!$local && !$inline) return false;
    }
    return true;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    answer(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$https = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
      || (($_SERVER['SERVER_PORT'] ?? '') === '443');
if (!$https) answer(400, ['ok' => false, 'error' => 'https_required']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$originHost = strtolower((string)parse_url($origin, PHP_URL_HOST));
$requestHost = strtolower((string)parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST));
if (parse_url($origin, PHP_URL_SCHEME) !== 'https' || $originHost === '' || $originHost !== $requestHost
    || !in_array($requestHost, ['damimmo.de', 'www.damimmo.de'], true)) {
    answer(403, ['ok' => false, 'error' => 'origin_not_allowed']);
}

$secretFile = __DIR__ . '/.publish-secret.php';
if (!is_file($secretFile)) answer(500, ['ok' => false, 'error' => 'key_not_configured']);
$publishSecret = require $secretFile;
$providedSecret = (string)($_SERVER['HTTP_X_PUBLISH_KEY'] ?? '');
if (!is_string($publishSecret) || !preg_match('/^[a-f0-9]{64}$/i', $publishSecret)) {
    answer(500, ['ok' => false, 'error' => 'key_not_configured']);
}
if (!hash_equals($publishSecret, $providedSecret)) answer(403, ['ok' => false, 'error' => 'invalid_key']);

$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length < 2 || $length > 9 * 1024 * 1024) answer(413, ['ok' => false, 'error' => 'payload_too_large']);
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 9 * 1024 * 1024) answer(413, ['ok' => false, 'error' => 'payload_too_large']);

try {
    $studio = json_decode($raw, true, 128, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    answer(400, ['ok' => false, 'error' => 'invalid_json']);
}
if (!is_array($studio) || !isset($studio['karten']) || !is_array($studio['karten'])) {
    answer(400, ['ok' => false, 'error' => 'invalid_menu']);
}
foreach (['wochenkarte', 'mittagstisch'] as $key) {
    if (isset($studio['karten'][$key]) && !valid_card($studio['karten'][$key])) {
        answer(400, ['ok' => false, 'error' => 'invalid_menu']);
    }
}

/* Make the new revision visible to the editor's existing stale-data check. */
$studio['stand'] = gmdate('Y-m-d\TH:i:s\Z');
$encoded = json_encode($studio, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
/* Studio and guest page are sibling folders: /menue-studio and /menue. */
$publicDirectory = dirname(__DIR__) . '/menue';
if (!is_dir($publicDirectory) || !is_writable($publicDirectory)) {
    answer(500, ['ok' => false, 'error' => 'write_failed']);
}
$target = $publicDirectory . '/menu.json';
$temporary = $publicDirectory . '/.menu-upload-' . bin2hex(random_bytes(8)) . '.tmp';
$backup = __DIR__ . '/.menu-backup.json';

if (is_file($target) && !@copy($target, $backup)) {
    answer(500, ['ok' => false, 'error' => 'backup_failed']);
}
if (@file_put_contents($temporary, $encoded, LOCK_EX) === false || !@rename($temporary, $target)) {
    @unlink($temporary);
    answer(500, ['ok' => false, 'error' => 'write_failed']);
}

answer(200, ['ok' => true, 'stand' => $studio['stand']]);
