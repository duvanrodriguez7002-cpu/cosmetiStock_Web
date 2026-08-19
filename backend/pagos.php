<?php

header("Content-Type: application/json; charset=utf-8");

require_once "conexion.php";

/* Lee la información enviada desde JavaScript. */
$datos = json_decode(file_get_contents("php://input"), true);

/* Obtiene la operación solicitada. */
$accion = $datos["accion"] ?? $_GET["accion"] ?? "";

/* Mantiene un formato de respuesta común para todo el módulo. */
function responder($ok, $mensaje, $datos = null)
{
    echo json_encode([
        "ok" => $ok,
        "mensaje" => $mensaje,
        "datos" => $datos
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/* Consulta las ventas que todavía tienen saldo pendiente. */
if ($accion === "pendientes") {

    $sql = "
        SELECT
            v.*,
            CONCAT(
                COALESCE(c.nombre, ''),
                ' ',
                COALESCE(c.apellido, '')
            ) AS nombre_cliente
        FROM ventas v
        LEFT JOIN clientes c
            ON c.id = v.cliente_id
        WHERE v.saldoPendiente > 0
        ORDER BY v.id DESC
    ";

    $resultado = $conexion->query($sql);

    if (!$resultado) {
        responder(
            false,
            "No se pudieron consultar las cuentas pendientes."
        );
    }

    $cuentas = [];

    while ($cuenta = $resultado->fetch_assoc()) {
        $cuentas[] = $cuenta;
    }

    responder(
        true,
        "Cuentas pendientes encontradas.",
        $cuentas
    );
}

/* Registra un nuevo pago y actualiza el saldo de la venta. */
if ($accion === "registrar") {

    $ventaId = intval($datos["venta_id"] ?? 0);
    $monto = floatval($datos["monto"] ?? 0);
    $metodoPago = trim($datos["metodo_pago"] ?? "");

    if ($ventaId <= 0 || $monto <= 0) {
        responder(false, "Los datos del pago no son válidos.");
    }

    $conexion->begin_transaction();

    try {

        /* Obtiene el saldo actual y bloquea la venta durante la operación. */
        $stmtVenta = $conexion->prepare("
            SELECT total, saldoPendiente
            FROM ventas
            WHERE id = ?
            FOR UPDATE
        ");

        $stmtVenta->bind_param("i", $ventaId);
        $stmtVenta->execute();

        $resultado = $stmtVenta->get_result();
        $venta = $resultado->fetch_assoc();

        if (!$venta) {
            throw new Exception("Venta no encontrada.");
        }

        $saldoActual = floatval($venta["saldoPendiente"]);

        if ($monto > $saldoActual) {
            throw new Exception(
                "El pago no puede ser mayor al saldo pendiente."
            );
        }

        $nuevoSaldo = $saldoActual - $monto;

        /* Registra el pago asociado a la venta. */
        $stmtPago = $conexion->prepare("
            INSERT INTO pagos
            (
                venta_id,
                monto,
                metodo_pago
            )
            VALUES (?, ?, ?)
        ");

        $stmtPago->bind_param(
            "ids",
            $ventaId,
            $monto,
            $metodoPago
        );

        if (!$stmtPago->execute()) {
            throw new Exception("No se pudo registrar el pago.");
        }

        /* Actualiza el saldo pendiente de la venta. */
        $stmtActualizar = $conexion->prepare("
            UPDATE ventas
            SET saldoPendiente = ?
            WHERE id = ?
        ");

        $stmtActualizar->bind_param(
            "di",
            $nuevoSaldo,
            $ventaId
        );

        if (!$stmtActualizar->execute()) {
            throw new Exception(
                "No se pudo actualizar el saldo."
            );
        }

        $conexion->commit();

        responder(
            true,
            "Pago registrado correctamente.",
            [
                "saldoPendiente" => $nuevoSaldo
            ]
        );

    } catch (Exception $e) {

        $conexion->rollback();

        responder(false, $e->getMessage());
    }
}

/* Devuelve un error cuando la acción no está definida. */
responder(false, "Acción de pagos no válida.");