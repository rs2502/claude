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
            /* Freitext statt Preis (z. B. "Tagespreis"): nur kurzer Text */
            if (isset($item['priceText']) && (!is_string($item['priceText']) || mb_strlen($item['priceText']) > 60)) return false;
        }
    }

    /* Background names are used in CSS url(...); allow only a local image file. */
    if (isset($card['hintergrund'])) {
        $background = $card['hintergrund'];
        if (!is_string($background) || !preg_match('/^[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i', $background)) return false;
        /* The guest page lives in /menue, so the image must exist there. */
        if (!is_file(dirname(__DIR__) . '/menue/bilder/' . $background)) return false;
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

/* The editor language is only the editor's preview; guests always start in German.
   Photos of single dishes are never shown, so they are not stored. */
$studio['sprache'] = 'de';
foreach (['wochenkarte', 'mittagstisch'] as $key) {
    foreach (($studio['karten'][$key]['sections'] ?? []) as $si => $section) {
        foreach (($section['items'] ?? []) as $ii => $item) {
            if (isset($item['bild']) && is_string($item['bild']) && str_starts_with($item['bild'], 'data:')) {
                unset($studio['karten'][$key]['sections'][$si]['items'][$ii]['bild']);
            }
        }
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

/* Refuse to overwrite a card that somebody else published in the meantime. */
$baseStand = $_SERVER['HTTP_X_BASE_STAND'] ?? null;
if ($baseStand !== null && is_file($target)) {
    $current = json_decode((string)@file_get_contents($target), true);
    $currentStand = is_array($current) ? (string)($current['stand'] ?? '') : '';
    if ($currentStand !== (string)$baseStand) {
        answer(409, ['ok' => false, 'error' => 'stale_menu', 'stand' => $currentStand]);
    }
}

/* Dated backups in a folder that the web server does not hand out. Keep the last 30. */
$backupDirectory = __DIR__ . '/backups';
if (is_file($target)) {
    if (!is_dir($backupDirectory) && !@mkdir($backupDirectory, 0755)) {
        answer(500, ['ok' => false, 'error' => 'backup_failed']);
    }
    $guard = $backupDirectory . '/.htaccess';
    if (!is_file($guard)) {
        @file_put_contents($guard, "Require all denied\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
    }
    $backup = $backupDirectory . '/menu-' . gmdate('Ymd\THis\Z') . '.json';
    if (!@copy($target, $backup)) {
        answer(500, ['ok' => false, 'error' => 'backup_failed']);
    }
    $old = glob($backupDirectory . '/menu-*.json') ?: [];
    sort($old);
    foreach (array_slice($old, 0, max(0, count($old) - 30)) as $file) @unlink($file);
}
if (@file_put_contents($temporary, $encoded, LOCK_EX) === false || !@rename($temporary, $target)) {
    @unlink($temporary);
    answer(500, ['ok' => false, 'error' => 'write_failed']);
}

answer(200, ['ok' => true, 'stand' => $studio['stand']]);
