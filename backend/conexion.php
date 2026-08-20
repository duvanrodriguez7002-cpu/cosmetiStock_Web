<?php

/* Datos de conexión de Aiven */
$host = getenv("DB_HOST");
$usuario = getenv("DB_USER");
$password = getenv("DB_PASSWORD");
$baseDatos = getenv("DB_NAME");
$puerto = getenv("DB_PORT");

$ssl_ca = getenv("DB_SSL_CA");

var_dump($ssl_ca);
var_dump(file_exists($ssl_ca));
var_dump(is_readable($ssl_ca));

exit;

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