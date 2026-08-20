<?php

/* Datos de conexión de Aiven */
$host = getenv("DB_HOST");
$usuario = getenv("DB_USER");
$password = getenv("DB_PASSWORD");
$baseDatos = getenv("DB_NAME");
$puerto = getenv("DB_PORT");
$ssl_ca = getenv("DB_SSL_CA");

/* Inicializa MySQLi */
$conexion = mysqli_init();

/* Configura SSL */
if (!$conexion->ssl_set(
    null,
    null,
    $ssl_ca,
    null,
    null
)) {
    die("Error al configurar SSL: " . $conexion->connect_error);
}

/* Conecta con Aiven */
if (!$conexion->real_connect(
    $host,
    $usuario,
    $password,
    $baseDatos,
    $puerto,
    null,
    MYSQLI_CLIENT_SSL
)) {
    die("Error de conexión con Aiven: " . $conexion->connect_error);
}

/* UTF-8 */
$conexion->set_charset("utf8mb4");

/* Zona horaria de Colombia */
$conexion->query("SET time_zone = '-05:00'");

/*
=========================================
        PRUEBA DE HORA MYSQL
=========================================
*/

$pruebaHora = $conexion->query("
    SELECT
        CURRENT_TIMESTAMP AS current_timestamp,
        NOW() AS now_mysql,
        UTC_TIMESTAMP() AS utc_mysql,
        @@session.time_zone AS zona_mysql
");

if ($pruebaHora) {

    $hora = $pruebaHora->fetch_assoc();

    error_log(
        "MYSQL -> CURRENT_TIMESTAMP: " .
        $hora["current_timestamp"] .
        " | NOW: " .
        $hora["now_mysql"] .
        " | UTC: " .
        $hora["utc_mysql"] .
        " | ZONA: " .
        $hora["zona_mysql"]
    );
}