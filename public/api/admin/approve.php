<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/lib/auth.php';

authEndpoint('POST', static function (): array {
    $tokenHash = bearerHash();
    $pdo = authDatabase();
    requireAccount($pdo, $tokenHash, 'admin');
    $body = authBody();
    $type = $body['approval_type'] ?? null;
    if ($type === 'retraining') {
        authError(501);
    }
    $target = $body['target_id'] ?? null;
    $decision = $body['decision'] ?? null;
    if ($type !== 'botanist_license' || !in_array($decision, ['approve', 'reject'], true) ||
        (!is_int($target) && !is_string($target)) ||
        !preg_match('/^[1-9][0-9]{0,19}$/D', (string) $target) ||
        (strlen((string) $target) === 20 && strcmp((string) $target, '18446744073709551615') > 0)) {
        authError(422);
    }

    $update = $pdo->prepare(
        'UPDATE users SET is_verified = ?, verification_rejected_at = IF(? = 1, NULL, UTC_TIMESTAMP())
         WHERE id = CAST(? AS UNSIGNED) AND role = ? AND is_verified = 0 AND verification_rejected_at IS NULL'
    );
    $approved = $decision === 'approve' ? 1 : 0;
    $update->execute([$approved, $approved, $target, 'botani']);
    if ($update->rowCount() !== 1) {
        $lookup = $pdo->prepare('SELECT id FROM users WHERE id = CAST(? AS UNSIGNED) AND role = ?');
        $lookup->execute([$target, 'botani']);
        authError($lookup->fetch() ? 409 : 403);
    }
    return ['updated_status' => $approved ? 'approved' : 'rejected'];
});
