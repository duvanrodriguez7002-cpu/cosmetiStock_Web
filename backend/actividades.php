<?php

header("Content-Type: application/json; charset=utf-8");

require_once "conexion.php";

/* Obtiene los datos enviados desde JavaScript. */
$datos = json_decode(file_get_contents("php://input"), true);

/* Identifica la operación solicitada. */
$accion = $datos["accion"] ?? $_GET["accion"] ?? "";

/* Envía respuestas JSON al frontend. */
function responder($ok, $mensaje, $datos = null)
{
    echo json_encode([
        "ok" => $ok,
        "mensaje" => $mensaje,
        "datos" => $datos
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*=========================================
        REGISTRAR ACTIVIDAD
=========================================*/

if ($accion === "registrar") {

    $tipo = trim($datos["tipo"] ?? "");
    $descripcion = trim($datos["descripcion"] ?? "");

    $clienteId = !empty($datos["cliente_id"])
        ? intval($datos["cliente_id"])
        : null;

    $ventaId = !empty($datos["venta_id"])
        ? intval($datos["venta_id"])
        : null;

    $productoId = !empty($datos["producto_id"])
        ? intval($datos["producto_id"])
        : null;

    $imagenId = !empty($datos["imagen_id"])
        ? intval($datos["imagen_id"])
        : null;

    $pagoId = !empty($datos["pago_id"])
        ? intval($datos["pago_id"])
        : null;

    if ($tipo === "") {
        responder(
            false,
            "El tipo de actividad es obligatorio."
        );
    }

    if ($descripcion === "") {
        responder(
            false,
            "La descripción de la actividad es obligatoria."
        );
    }

    $stmt = $conexion->prepare("
        INSERT INTO actividades
        (
            tipo,
            descripcion,
            cliente_id,
            venta_id,
            producto_id,
            imagen_id,
            pago_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar el registro de la actividad."
        );
    }

    $stmt->bind_param(
        "ssiiiii",
        $tipo,
        $descripcion,
        $clienteId,
        $ventaId,
        $productoId,
        $imagenId,
        $pagoId
    );

    if (!$stmt->execute()) {
        responder(
            false,
            "No se pudo registrar la actividad: " .
            $stmt->error
        );
    }

    $idActividad = $stmt->insert_id;

    $stmt->close();

    responder(
        true,
        "Actividad registrada correctamente.",
        [
            "id" => $idActividad
        ]
    );
}

/*=========================================
        LISTAR ACTIVIDADES
=========================================*/

if ($accion === "listar") {

    $limite = intval($datos["limite"] ?? 12);

    if ($limite <= 0) {
        $limite = 12;
    }

    if ($limite > 50) {
        $limite = 50;
    }

    $stmt = $conexion->prepare("
        SELECT
            a.id,
            a.tipo,
            a.descripcion,
            a.cliente_id,
            a.venta_id,
            a.producto_id,
            a.imagen_id,
            a.pago_id,
            a.fecha,

            c.nombre AS cliente_nombre,
            c.apellido AS cliente_apellido,

            p.nombre AS producto_nombre,
            p.codigo AS producto_codigo,

            v.fecha AS venta_fecha,

            pg.valor AS pago_valor

        FROM actividades a

        LEFT JOIN clientes c
            ON a.cliente_id = c.id

        LEFT JOIN productos p
            ON a.producto_id = p.id

        LEFT JOIN ventas v
            ON a.venta_id = v.id

        LEFT JOIN pagos pg
            ON a.pago_id = pg.id

        ORDER BY a.id DESC

        LIMIT ?
    ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar la consulta de actividades."
        );
    }

    $stmt->bind_param("i", $limite);

    if (!$stmt->execute()) {
        responder(
            false,
            "No se pudieron consultar las actividades."
        );
    }

    $resultado = $stmt->get_result();

    $actividades = [];

    while ($actividad = $resultado->fetch_assoc()) {
        $actividades[] = $actividad;
    }

    $stmt->close();

    responder(
        true,
        "Actividades encontradas.",
        $actividades
    );
}

/*=========================================
        ACTIVIDAD POR ID
=========================================*/

if ($accion === "obtener") {

    $id = intval($datos["id"] ?? 0);

    if ($id <= 0) {
        responder(
            false,
            "El ID de la actividad no es válido."
        );
    }

    $stmt = $conexion->prepare("
        SELECT
            a.id,
            a.tipo,
            a.descripcion,
            a.cliente_id,
            a.venta_id,
            a.producto_id,
            a.imagen_id,
            a.pago_id,
            a.fecha,

            c.nombre AS cliente_nombre,
            c.apellido AS cliente_apellido,

            p.nombre AS producto_nombre,
            p.codigo AS producto_codigo,

            v.fecha AS venta_fecha,

            pg.valor AS pago_valor

        FROM actividades a

        LEFT JOIN clientes c
            ON a.cliente_id = c.id

        LEFT JOIN productos p
            ON a.producto_id = p.id

        LEFT JOIN ventas v
            ON a.venta_id = v.id

        LEFT JOIN pagos pg
            ON a.pago_id = pg.id

        WHERE a.id = ?
    ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar la consulta."
        );
    }

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        responder(
            false,
            "No se pudo consultar la actividad."
        );
    }

    $resultado = $stmt->get_result();

    $actividad = $resultado->fetch_assoc();

    $stmt->close();

    if (!$actividad) {
        responder(
            false,
            "La actividad no existe."
        );
    }

    responder(
        true,
        "Actividad encontrada.",
        $actividad
    );
}

/* Devuelve un error cuando la acción no existe. */
responder(
    false,
    "Acción de actividades no válida."
);
?>