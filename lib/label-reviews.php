<?php
declare(strict_types=1);

require_once __DIR__ . '/consultations.php';

function reviewStorage(callable $operation): array
{
    try {
        return $operation();
    } catch (PDOException $error) {
        $driverCode = (int) ($error->errorInfo[1] ?? 0);
        if (in_array($driverCode, [1142, 1143, 1146, 1054], true)) {
            // Log numeric diagnostics only; never log credentials, SQL parameters or notes.
            error_log('PisangLens label review storage unavailable (MySQL ' . $driverCode . ').');
            respondJson(['status' => 'error', 'code' => 'review_storage_unavailable'], 503);
        }
        throw $error;
    }
}
