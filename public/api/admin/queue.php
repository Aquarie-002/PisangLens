<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/lib/auth.php';

authEndpoint('GET', static function (): array {
    $tokenHash = bearerHash();
    $pdo = authDatabase();
    requireAccount($pdo, $tokenHash, 'admin');
    $type = $_GET['type'] ?? '';
    if ($type === 'retraining') {
        authError(501);
    }
    if ($type !== 'botanist') {
        authError(422);
    }
    $query = $pdo->prepare(
        "SELECT id, name, email, license_number, institution, province, city,
         DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at FROM users
         WHERE role = ? AND is_verified = 0 AND verification_rejected_at IS NULL ORDER BY created_at, id"
    );
    $query->execute(['botani']);
    return $query->fetchAll();
});
