<?php

header("Content-Type: application/json; charset=utf-8");

require_once "conexion.php";

/* Lee los datos enviados desde JavaScript. */
$datos = json_decode(file_get_contents("php://input"), true);

/* Obtiene la acción solicitada. */
$accion = $datos["accion"] ?? $_GET["accion"] ?? "";

/* Devuelve respuestas JSON uniformes. */
function responder($ok, $mensaje, $datos = null)
{
    echo json_encode([
        "ok" => $ok,
        "mensaje" => $mensaje,
        "datos" => $datos
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/* Obtiene las estadísticas generales utilizadas por el dashboard. */
if ($accion === "dashboard") {

    $estadisticas = [];

    $resultado = $conexion->query("
        SELECT COUNT(*) AS total
        FROM productos
        WHERE activo = 1
    ");

    $estadisticas["productos"] =
        (int)$resultado->fetch_assoc()["total"];

    $resultado = $conexion->query("
        SELECT COALESCE(SUM(cantidad), 0) AS total
        FROM productos
        WHERE activo = 1
    ");

    $estadisticas["unidades"] =
        (int)$resultado->fetch_assoc()["total"];

    $resultado = $conexion->query("
        SELECT COUNT(*) AS total
        FROM clientes
        WHERE activo = 1
    ");

    $estadisticas["clientes"] =
        (int)$resultado->fetch_assoc()["total"];

    $resultado = $conexion->query("
        SELECT COUNT(*) AS total
        FROM ventas
    ");

    $estadisticas["ventas"] =
        (int)$resultado->fetch_assoc()["total"];

    $resultado = $conexion->query("
        SELECT COALESCE(SUM(total), 0) AS total
        FROM ventas
    ");

    $estadisticas["ingresos"] =
        (float)$resultado->fetch_assoc()["total"];

    $resultado = $conexion->query("
        SELECT COUNT(*) AS total
        FROM ventas
        WHERE saldoPendiente > 0
    ");

    $estadisticas["cuentasPendientes"] =
        (int)$resultado->fetch_assoc()["total"];

    responder(
        true,
        "Estadísticas obtenidas.",
        $estadisticas
    );
}

/* Devuelve las alertas principales del sistema. */
if ($accion === "alertas") {

    $alertas = [];

    $resultado = $conexion->query("
        SELECT id, nombre, cantidad
        FROM productos
        WHERE activo = 1
        AND cantidad = 0
        ORDER BY nombre
    ");

    while ($producto = $resultado->fetch_assoc()) {

        $alertas[] = [
            "tipo" => "agotado",
            "producto" => $producto["nombre"],
            "cantidad" => 0
        ];
    }

    $resultado = $conexion->query("
        SELECT id, nombre, cantidad
        FROM productos
        WHERE activo = 1
        AND cantidad > 0
        AND cantidad <= 5
        ORDER BY cantidad ASC
    ");

    while ($producto = $resultado->fetch_assoc()) {

        $alertas[] = [
            "tipo" => "stock_bajo",
            "producto" => $producto["nombre"],
            "cantidad" => (int)$producto["cantidad"]
        ];
    }

    $resultado = $conexion->query("
        SELECT
            v.id,
            v.saldoPendiente
        FROM ventas v
        WHERE v.saldoPendiente > 0
    ");

    while ($venta = $resultado->fetch_assoc()) {

        $alertas[] = [
            "tipo" => "pago_pendiente",
            "venta_id" => (int)$venta["id"],
            "saldo" => (float)$venta["saldoPendiente"]
        ];
    }

    responder(
        true,
        "Alertas obtenidas.",
        $alertas
    );
}

/* Devuelve un error cuando la acción no existe. */
responder(false, "Acción de API no válida.");