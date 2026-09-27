<?php

declare(strict_types=1);

// Timestamp disimpan sebagai UTC. Frontend mengonversinya secara eksplisit ke WIB.
date_default_timezone_set('UTC');

final class Database
{
    private static ?PDO $connection = null;

    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $config = require __DIR__ . '/config.php';
        $db = $config['db'];
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $db['host'],
            $db['port'],
            $db['database'],
            $db['charset']
        );

        self::$connection = new PDO($dsn, $db['username'], $db['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        // Samakan NOW(), CURRENT_TIMESTAMP, dan timestamp database di semua mesin.
        self::$connection->exec("SET time_zone = '+00:00'");

        return self::$connection;
    }
}
