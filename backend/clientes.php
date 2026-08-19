<?php

header("Content-Type: application/json; charset=utf-8");

require_once "conexion.php";

/* Lee la información enviada por JavaScript. */
$datos = json_decode(file_get_contents("php://input"), true);

/* Determina qué operación de clientes se debe ejecutar. */
$accion = $datos["accion"] ?? $_GET["accion"] ?? "";

/* Envía todas las respuestas del módulo en formato JSON. */
function responder($ok, $mensaje, $datos = null)
{
    echo json_encode([
        "ok" => $ok,
        "mensaje" => $mensaje,
        "datos" => $datos
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/* Consulta todos los clientes activos. */
if ($accion === "listar") {

    $resultado = $conexion->query("
        SELECT
            id,
            nombre,
            apellido,
            telefono,
            correo,
            direccion,
            activo,
            fecha_creacion
        FROM clientes
        WHERE activo = 1
        ORDER BY id DESC
    ");

    if (!$resultado) {
        responder(false, "No se pudieron consultar los clientes.");
    }

    $clientes = [];

    while ($cliente = $resultado->fetch_assoc()) {
        $clientes[] = $cliente;
    }

    responder(
        true,
        "Clientes encontrados.",
        $clientes
    );
}

/* Obtiene un cliente específico. */
if ($accion === "obtener") {

    $id = intval($datos["id"] ?? 0);

    if ($id <= 0) {
        responder(false, "ID de cliente no válido.");
    }

    $stmt = $conexion->prepare("
        SELECT
            id,
            nombre,
            apellido,
            telefono,
            correo,
            direccion,
            activo,
            fecha_creacion
        FROM clientes
        WHERE id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        responder(false, "No se pudo preparar la consulta del cliente.");
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $cliente = $resultado->fetch_assoc();

    $stmt->close();

    if (!$cliente) {
        responder(false, "Cliente no encontrado.");
    }

    responder(
        true,
        "Cliente encontrado.",
        $cliente
    );
}

/* Crea un nuevo cliente. */
if ($accion === "crear") {

    $nombre = trim($datos["nombre"] ?? "");
    $apellido = trim($datos["apellido"] ?? "");
    $telefono = trim($datos["telefono"] ?? "");
    $correo = trim($datos["correo"] ?? "");
    $direccion = trim($datos["direccion"] ?? "");

    if ($nombre === "") {
        responder(
            false,
            "El nombre del cliente es obligatorio."
        );
    }

    $stmt = $conexion->prepare("
        INSERT INTO clientes
        (
            nombre,
            apellido,
            telefono,
            correo,
            direccion,
            activo
        )
        VALUES (?, ?, ?, ?, ?, 1)
    ");

    if (!$stmt) {
        responder(false, "No se pudo preparar el registro del cliente.");
    }

    $stmt->bind_param(
        "sssss",
        $nombre,
        $apellido,
        $telefono,
        $correo,
        $direccion
    );

    if (!$stmt->execute()) {
        responder(false, "No se pudo crear el cliente.");
    }

    $idCliente = $stmt->insert_id;

    $stmt->close();

    responder(
        true,
        "Cliente creado correctamente.",
        [
            "id" => $idCliente
        ]
    );
}

/* Actualiza la información de un cliente. */
if ($accion === "editar") {

    $id = intval($datos["id"] ?? 0);

    $nombre = trim($datos["nombre"] ?? "");
    $apellido = trim($datos["apellido"] ?? "");
    $telefono = trim($datos["telefono"] ?? "");
    $correo = trim($datos["correo"] ?? "");
    $direccion = trim($datos["direccion"] ?? "");

    if ($id <= 0) {
        responder(false, "ID de cliente no válido.");
    }

    if ($nombre === "") {
        responder(
            false,
            "El nombre del cliente es obligatorio."
        );
    }

    $stmt = $conexion->prepare("
        UPDATE clientes
        SET
            nombre = ?,
            apellido = ?,
            telefono = ?,
            correo = ?,
            direccion = ?
        WHERE id = ?
    ");

    if (!$stmt) {
        responder(false, "No se pudo preparar la actualización del cliente.");
    }

    $stmt->bind_param(
        "sssssi",
        $nombre,
        $apellido,
        $telefono,
        $correo,
        $direccion,
        $id
    );

    if (!$stmt->execute()) {
        responder(false, "No se pudo actualizar el cliente.");
    }

    $stmt->close();

    responder(
        true,
        "Cliente actualizado correctamente."
    );
}

/* Elimina el cliente si no tiene ventas o lo desactiva si tiene historial. */
if ($accion === "eliminar") {

    $id = intval($datos["id"] ?? 0);

    if ($id <= 0) {
        responder(false, "ID de cliente no válido.");
    }

    /* Comprueba si el cliente tiene ventas registradas. */
    $stmt = $conexion->prepare("
        SELECT COUNT(*) AS total
        FROM ventas
        WHERE cliente_id = ?
    ");

    if (!$stmt) {
        responder(false, "No se pudo comprobar el historial del cliente.");
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();

    $stmt->close();

    $totalVentas = intval($fila["total"] ?? 0);

    /*
    Si tiene ventas, no se elimina.
    Se conserva el cliente para mantener su historial.
    */
    if ($totalVentas > 0) {

        $stmt = $conexion->prepare("
            UPDATE clientes
            SET activo = 0
            WHERE id = ?
        ");

        if (!$stmt) {
            responder(false, "No se pudo desactivar el cliente.");
        }

        $stmt->bind_param("i", $id);

        if (!$stmt->execute()) {
            responder(false, "No se pudo desactivar el cliente.");
        }

        $stmt->close();

        responder(
            true,
            "El cliente tiene ventas registradas y fue desactivado para conservar su historial.",
            [
                "accion" => "desactivado",
                "id" => $id,
                "ventas" => $totalVentas
            ]
        );
    }

    /*
    Si no tiene ventas, se puede eliminar físicamente.
    */
    $stmt = $conexion->prepare("
        DELETE FROM clientes
        WHERE id = ?
    ");

    if (!$stmt) {
        responder(false, "No se pudo preparar la eliminación del cliente.");
    }

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        responder(false, "No se pudo eliminar el cliente.");
    }

    $stmt->close();

    responder(
        true,
        "Cliente eliminado correctamente.",
        [
            "accion" => "eliminado",
            "id" => $id,
            "ventas" => 0
        ]
    );
}