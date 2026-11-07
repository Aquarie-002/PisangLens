<?php
declare(strict_types=1);
require_once dirname(__DIR__, 3) . '/lib/label-reviews.php';

authEndpoint('GET', static fn (): array => reviewStorage(static function (): array {
    $pdo = authDatabase();
    $user = requireAccount($pdo, bearerHash(), 'botani');
    $ticket = participantTicket($pdo, $user, objectId($_GET['consultation_id'] ?? null));
    $query = $pdo->prepare('SELECT id AS queue_id, review_outcome, corrected_label, review_note, status FROM retraining_queue WHERE scan_id = ? AND consultation_id = ? AND reviewed_by = ?');
    $query->execute([$ticket['scan_id'], $ticket['id'], $user['id']]);
    return ['review' => $query->fetch() ?: null];
}));
