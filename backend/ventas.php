<?php
header("Content-Type: application/json; charset=utf-8");
require_once "conexion.php";

$datos = json_decode(file_get_contents("php://input"), true);
$accion = $datos["accion"] ?? $_GET["accion"] ?? "";

function responder($ok, $mensaje, $datos = null)
{
    echo json_encode([
        "ok" => $ok,
        "mensaje" => $mensaje,
        "datos" => $datos
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
=========================================
LISTAR VENTAS
=========================================
*/
if ($accion === "listar") {

    /*
    =========================================
    1. OBTENER VENTAS Y CLIENTES
    =========================================
    */

    $sqlVentas = "
        SELECT
            v.id,
            v.cliente_id,
            v.fecha,
            v.metodo_pago AS metodoPago,
            v.descuento,
            v.fecha_credito AS fechaCredito,

            c.id AS cliente_id_real,
            c.nombre AS cliente_nombre,
            c.apellido AS cliente_apellido,
            c.telefono AS cliente_telefono,
            c.correo AS cliente_correo,
            c.direccion AS cliente_direccion,
            c.activo AS cliente_activo

        FROM ventas v

        LEFT JOIN clientes c
            ON c.id = v.cliente_id

        ORDER BY v.id DESC
    ";

    $resultadoVentas = $conexion->query($sqlVentas);

    if (!$resultadoVentas) {
        responder(
            false,
            "No se pudieron consultar las ventas."
        );
    }

    $ventas = [];
    $ventasPorId = [];

    while ($venta = $resultadoVentas->fetch_assoc()) {

        $ventaId = (int)$venta["id"];

        $cliente = null;

        if ($venta["cliente_id_real"] !== null) {

            $cliente = [
                "id" =>
                    (int)$venta["cliente_id_real"],

                "nombre" =>
                    $venta["cliente_nombre"] ?? "",

                "apellido" =>
                    $venta["cliente_apellido"] ?? "",

                "telefono" =>
                    $venta["cliente_telefono"] ?? "",

                "correo" =>
                    $venta["cliente_correo"] ?? "",

                "direccion" =>
                    $venta["cliente_direccion"] ?? "",

                "activo" =>
                    (int)($venta["cliente_activo"] ?? 0)
            ];

        }

        $objetoVenta = [

            "id" =>
                $ventaId,

            "cliente_id" =>
                $venta["cliente_id"] !== null
                    ? (int)$venta["cliente_id"]
                    : null,

            "fecha" =>
                $venta["fecha"],

            "metodoPago" =>
                $venta["metodoPago"] ?? "contado",

            "descuento" =>
                (float)$venta["descuento"],

            "fechaCredito" =>
                $venta["fechaCredito"] ?? null,

            "subtotal" => 0,

            "total" => 0,

            "ganancia" => 0,

            "abono" => 0,

            "saldoPendiente" => 0,

            "estadoPago" => "Pagado",

            "cliente" =>
                $cliente,

            "productos" => []

        ];

        $ventas[] = $objetoVenta;

        $ventasPorId[$ventaId] =
            count($ventas) - 1;
    }


    /*
    =========================================
    2. OBTENER TODOS LOS DETALLES
    =========================================
    */

    $sqlDetalles = "
        SELECT
            dv.venta_id,
            dv.producto_id,
            p.nombre,
            dv.cantidad,
            dv.precio_unitario AS precio,
            dv.subtotal,
            dv.ganancia

        FROM detalle_ventas dv

        INNER JOIN productos p
            ON p.id = dv.producto_id

        ORDER BY
            dv.venta_id DESC,
            dv.id ASC
    ";

    $resultadoDetalles =
        $conexion->query($sqlDetalles);

    if (!$resultadoDetalles) {

        responder(
            false,
            "No se pudieron consultar los productos de las ventas."
        );

    }


    while ($detalle =
        $resultadoDetalles->fetch_assoc()) {

        $ventaId =
            (int)$detalle["venta_id"];

        if (!isset($ventasPorId[$ventaId])) {
            continue;
        }

        $indice =
            $ventasPorId[$ventaId];

        $subtotalDetalle =
            (float)$detalle["subtotal"];

        $gananciaDetalle =
            (float)$detalle["ganancia"];

        $ventas[$indice]["productos"][] = [

            "producto_id" =>
                (int)$detalle["producto_id"],

            "nombre" =>
                $detalle["nombre"] ?? "",

            "cantidad" =>
                (int)$detalle["cantidad"],

            "precio" =>
                (float)$detalle["precio"],

            "subtotal" =>
                $subtotalDetalle,

            "ganancia" =>
                $gananciaDetalle

        ];

        $ventas[$indice]["subtotal"] +=
            $subtotalDetalle;

        $ventas[$indice]["ganancia"] +=
            $gananciaDetalle;

    }


    /*
    =========================================
    3. OBTENER TODOS LOS PAGOS
    =========================================
    */

    $sqlPagos = "
        SELECT
            venta_id,
            COALESCE(SUM(valor), 0) AS pagado

        FROM pagos

        GROUP BY venta_id
    ";

    $resultadoPagos =
        $conexion->query($sqlPagos);

    if (!$resultadoPagos) {

        responder(
            false,
            "No se pudieron consultar los pagos."
        );

    }


    while ($pago =
        $resultadoPagos->fetch_assoc()) {

        $ventaId =
            (int)$pago["venta_id"];

        if (!isset($ventasPorId[$ventaId])) {
            continue;
        }

        $indice =
            $ventasPorId[$ventaId];

        $pagado =
            (float)$pago["pagado"];

        $ventas[$indice]["abono"] =
            $pagado;

    }


    /*
    =========================================
    4. CALCULAR TOTALES Y SALDOS
    =========================================
    */

    foreach ($ventas as &$venta) {

        $venta["descuento"] =
            (float)$venta["descuento"];

        $venta["subtotal"] =
            (float)$venta["subtotal"];

        $venta["total"] =
            max(
                0,
                $venta["subtotal"] -
                $venta["descuento"]
            );

        $venta["ganancia"] =
            (float)$venta["ganancia"];

        $venta["abono"] =
            (float)$venta["abono"];

        $venta["saldoPendiente"] =
            max(
                0,
                $venta["total"] -
                $venta["abono"]
            );

        $venta["estadoPago"] =
            $venta["saldoPendiente"] <= 0
                ? "Pagado"
                : "Pendiente";

    }

    unset($venta);


    /*
    =========================================
    RESPUESTA
    =========================================
    */

    responder(
        true,
        "Ventas encontradas.",
        $ventas
    );
}

/*
=========================================
OBTENER UNA VENTA
=========================================
*/
if ($accion === "obtener") {

    $id = intval($datos["id"] ?? 0);

    if ($id <= 0) {
        responder(false, "ID de venta no válido.");
    }

    $stmt = $conexion->prepare("
        SELECT
            v.id,
            v.cliente_id,
            v.fecha,
            v.metodo_pago AS metodoPago,
            v.descuento,
            v.fecha_credito AS fechaCredito,
            c.id AS cliente_id_real,
            c.nombre AS cliente_nombre,
            c.apellido AS cliente_apellido,
            c.telefono AS cliente_telefono,
            c.correo AS cliente_correo,
            c.direccion AS cliente_direccion,
            c.activo AS cliente_activo
        FROM ventas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        responder(false, "No se pudo preparar la consulta de la venta.");
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $venta = $resultado->fetch_assoc();

    $stmt->close();

    if (!$venta) {
        responder(false, "Venta no encontrada.");
    }

    $cliente = null;

    if ($venta["cliente_id_real"] !== null) {
        $cliente = [
            "id" => (int)$venta["cliente_id_real"],
            "nombre" => $venta["cliente_nombre"] ?? "",
            "apellido" => $venta["cliente_apellido"] ?? "",
            "telefono" => $venta["cliente_telefono"] ?? "",
            "correo" => $venta["cliente_correo"] ?? "",
            "direccion" => $venta["cliente_direccion"] ?? "",
            "activo" => (int)($venta["cliente_activo"] ?? 0)
        ];
    }

    $stmtDetalle = $conexion->prepare("
        SELECT
            dv.producto_id,
            p.nombre,
            dv.cantidad,
            dv.precio_unitario AS precio,
            dv.subtotal,
            dv.ganancia
        FROM detalle_ventas dv
        INNER JOIN productos p ON p.id = dv.producto_id
        WHERE dv.venta_id = ?
        ORDER BY dv.id ASC
    ");

    if (!$stmtDetalle) {
        responder(false, "No se pudieron consultar los productos de la venta.");
    }

    $stmtDetalle->bind_param("i", $id);
    $stmtDetalle->execute();

    $resultadoDetalle = $stmtDetalle->get_result();
    $productos = [];
    $subtotal = 0;
    $ganancia = 0;

    while ($detalle = $resultadoDetalle->fetch_assoc()) {

        $subtotal += (float)$detalle["subtotal"];
        $ganancia += (float)$detalle["ganancia"];

        $productos[] = [
            "producto_id" => (int)$detalle["producto_id"],
            "nombre" => $detalle["nombre"] ?? "",
            "cantidad" => (int)$detalle["cantidad"],
            "precio" => (float)$detalle["precio"],
            "subtotal" => (float)$detalle["subtotal"],
            "ganancia" => (float)$detalle["ganancia"]
        ];
    }

    $stmtDetalle->close();

    $descuento = (float)$venta["descuento"];
    $total = max(0, $subtotal - $descuento);

    $stmtPagos = $conexion->prepare("
        SELECT COALESCE(SUM(valor), 0) AS pagado
        FROM pagos
        WHERE venta_id = ?
    ");

    if (!$stmtPagos) {
        responder(false, "No se pudieron consultar los pagos de la venta.");
    }

    $stmtPagos->bind_param("i", $id);
    $stmtPagos->execute();

    $resultadoPagos = $stmtPagos->get_result();
    $filaPagos = $resultadoPagos->fetch_assoc();

    $pagado = (float)$filaPagos["pagado"];

    $stmtPagos->close();

    $saldoPendiente = max(0, $total - $pagado);
    $estadoPago = $saldoPendiente <= 0 ? "Pagado" : "Pendiente";

    unset(
        $venta["cliente_id_real"],
        $venta["cliente_nombre"],
        $venta["cliente_apellido"],
        $venta["cliente_telefono"],
        $venta["cliente_correo"],
        $venta["cliente_direccion"],
        $venta["cliente_activo"]
    );

    $venta["id"] = (int)$venta["id"];
    $venta["cliente_id"] = $venta["cliente_id"] !== null
        ? (int)$venta["cliente_id"]
        : null;

    $venta["subtotal"] = $subtotal;
    $venta["descuento"] = $descuento;
    $venta["total"] = $total;
    $venta["ganancia"] = $ganancia;
    $venta["abono"] = $pagado;
    $venta["saldoPendiente"] = $saldoPendiente;
    $venta["estadoPago"] = $estadoPago;
    $venta["cliente"] = $cliente;
    $venta["productos"] = $productos;

    responder(true, "Venta encontrada.", $venta);
}

/*
=========================================
REGISTRAR VENTA
=========================================
*/
if ($accion === "registrar") {

    $clienteId = intval($datos["cliente_id"] ?? 0);
    $clienteId = $clienteId > 0 ? $clienteId : null;

    $descuento = floatval($datos["descuento"] ?? 0);
    $metodoPago = trim($datos["metodo_pago"] ?? "contado");
    $fechaCredito = trim($datos["fecha_credito"] ?? "");
    $detalles = $datos["detalles"] ?? [];

    if (empty($detalles) || !is_array($detalles)) {
        responder(false, "La venta debe contener productos.");
    }

    if (!in_array($metodoPago, ["contado", "abono", "credito"])) {
        responder(false, "Método de pago no válido.");
    }

    if ($descuento < 0) {
        responder(false, "El descuento no puede ser negativo.");
    }

    if ($metodoPago === "credito" && $fechaCredito === "") {
        responder(false, "Seleccione una fecha límite.");
    }

    if ($metodoPago !== "credito") {
        $fechaCredito = null;
    }

    $conexion->begin_transaction();

    try {

        /*
        =========================================
        REGISTRAR CABECERA DE LA VENTA
        =========================================
        */

        $stmtVenta = $conexion->prepare("
            INSERT INTO ventas
            (
                cliente_id,
                metodo_pago,
                descuento,
                fecha_credito
            )
            VALUES (?, ?, ?, ?)
        ");

        if (!$stmtVenta) {
            throw new Exception("No se pudo preparar el registro de la venta.");
        }

        $stmtVenta->bind_param(
            "isds",
            $clienteId,
            $metodoPago,
            $descuento,
            $fechaCredito
        );

        if (!$stmtVenta->execute()) {
            throw new Exception("No se pudo registrar la venta.");
        }

        $ventaId = $stmtVenta->insert_id;
        $stmtVenta->close();

        /*
        =========================================
        CONSULTAR PRODUCTO
        =========================================
        */

        $stmtProducto = $conexion->prepare("
            SELECT
                precio,
                costo,
                cantidad
            FROM productos
            WHERE id = ?
            FOR UPDATE
        ");

        if (!$stmtProducto) {
            throw new Exception("No se pudo preparar la consulta del producto.");
        }

        /*
        =========================================
        INSERTAR DETALLE
        =========================================
        */

        $stmtDetalle = $conexion->prepare("
            INSERT INTO detalle_ventas
            (
                venta_id,
                producto_id,
                cantidad,
                precio_unitario,
                subtotal,
                ganancia
            )
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        if (!$stmtDetalle) {
            throw new Exception("No se pudo preparar el detalle de la venta.");
        }

        /*
        =========================================
        ACTUALIZAR INVENTARIO
        =========================================
        */

        $stmtStock = $conexion->prepare("
            UPDATE productos
            SET
                cantidad = cantidad - ?,
                vendidos = COALESCE(vendidos, 0) + ?,
                ultima_venta = NOW(),
                fecha_actualizacion = NOW()
            WHERE id = ?
        ");

        if (!$stmtStock) {
            throw new Exception("No se pudo preparar la actualización del inventario.");
        }

        $subtotalVenta = 0;
        $gananciaVenta = 0;

        foreach ($detalles as $detalle) {

            $productoId = intval($detalle["producto_id"] ?? 0);
            $cantidad = intval($detalle["cantidad"] ?? 0);

            if ($productoId <= 0 || $cantidad <= 0) {
                throw new Exception("Detalle de producto no válido.");
            }

            $stmtProducto->bind_param("i", $productoId);
            $stmtProducto->execute();

            $resultadoProducto = $stmtProducto->get_result();
            $producto = $resultadoProducto->fetch_assoc();

            if (!$producto) {
                throw new Exception("Producto no encontrado.");
            }

            $stockActual = (int)$producto["cantidad"];

            if ($stockActual < $cantidad) {
                throw new Exception("No hay suficiente inventario para el producto.");
            }

            $precio = (float)$producto["precio"];
            $costo = (float)$producto["costo"];

            $subtotalDetalle = $precio * $cantidad;
            $gananciaDetalle = ($precio - $costo) * $cantidad;

            $subtotalVenta += $subtotalDetalle;
            $gananciaVenta += $gananciaDetalle;

            $stmtDetalle->bind_param(
                "iiiddd",
                $ventaId,
                $productoId,
                $cantidad,
                $precio,
                $subtotalDetalle,
                $gananciaDetalle
            );

            if (!$stmtDetalle->execute()) {
                throw new Exception("No se pudo registrar el detalle de la venta.");
            }

            $stmtStock->bind_param(
                "iii",
                $cantidad,
                $cantidad,
                $productoId
            );

            if (!$stmtStock->execute()) {
                throw new Exception("No se pudo actualizar el inventario.");
            }
        }

        $stmtProducto->close();
        $stmtDetalle->close();
        $stmtStock->close();

        /*
        =========================================
        CALCULAR TOTAL
        =========================================
        */

        $totalVenta = max(0, $subtotalVenta - $descuento);

        /*
        =========================================
        REGISTRAR PAGO INICIAL
        =========================================
        */

        $pagoInicial = 0;

        if ($metodoPago === "contado") {
            $pagoInicial = $totalVenta;
        }

        if ($metodoPago === "abono") {

            $pagoInicial = floatval(
                $datos["abono"] ?? 0
            );

            if ($pagoInicial <= 0) {
                throw new Exception("Ingrese el valor del abono.");
            }

            if ($pagoInicial > $totalVenta) {
                throw new Exception("El abono no puede ser mayor al total.");
            }
        }

        if ($pagoInicial > 0) {

            $stmtPago = $conexion->prepare("
                INSERT INTO pagos
                (
                    venta_id,
                    valor,
                    observacion
                )
                VALUES (?, ?, ?)
            ");

            if (!$stmtPago) {
                throw new Exception("No se pudo preparar el registro del pago.");
            }

            $observacion = $metodoPago === "contado"
                ? "Pago completo de la venta."
                : "Abono inicial de la venta.";

            $stmtPago->bind_param(
                "ids",
                $ventaId,
                $pagoInicial,
                $observacion
            );

            if (!$stmtPago->execute()) {
                throw new Exception("No se pudo registrar el pago.");
            }

            $stmtPago->close();
        }

        $saldoPendiente = max(
            0,
            $totalVenta - $pagoInicial
        );

        $estadoPago = $saldoPendiente <= 0
            ? "Pagado"
            : "Pendiente";

        $conexion->commit();

        responder(
            true,
            "Venta registrada correctamente.",
            [
                "venta_id" => $ventaId,
                "subtotal" => $subtotalVenta,
                "descuento" => $descuento,
                "total" => $totalVenta,
                "ganancia" => $gananciaVenta,
                "abono" => $pagoInicial,
                "saldoPendiente" => $saldoPendiente,
                "estadoPago" => $estadoPago
            ]
        );

    } catch (Exception $e) {

        $conexion->rollback();

        responder(
            false,
            $e->getMessage()
        );
    }
}

/*
=========================================
REGISTRAR PAGO
=========================================
*/
if ($accion === "registrar_pago") {

    $idVenta = intval($datos["id"] ?? 0);
    $monto = floatval($datos["monto"] ?? 0);
    $observacion = trim($datos["observacion"] ?? "Pago registrado.");

    if ($idVenta <= 0) {
        responder(false, "ID de venta no válido.");
    }

    if ($monto <= 0) {
        responder(false, "El valor del pago debe ser mayor que cero.");
    }

    $conexion->begin_transaction();

    try {

        /*
        Obtener el total de la venta mediante
        sus detalles y descuento.
        */

        $stmtVenta = $conexion->prepare("
            SELECT
                v.id,
                v.descuento,
                COALESCE(SUM(dv.subtotal), 0) AS subtotal
            FROM ventas v
            LEFT JOIN detalle_ventas dv
                ON dv.venta_id = v.id
            WHERE v.id = ?
            GROUP BY v.id, v.descuento
            FOR UPDATE
        ");

        if (!$stmtVenta) {
            throw new Exception("No se pudo consultar la venta.");
        }

        $stmtVenta->bind_param("i", $idVenta);
        $stmtVenta->execute();

        $resultadoVenta = $stmtVenta->get_result();
        $venta = $resultadoVenta->fetch_assoc();

        $stmtVenta->close();

        if (!$venta) {
            throw new Exception("Venta no encontrada.");
        }

        $subtotal = (float)$venta["subtotal"];
        $descuento = (float)$venta["descuento"];

        $total = max(
            0,
            $subtotal - $descuento
        );

        /*
        Obtener pagos realizados anteriormente.
        */

        $stmtPagos = $conexion->prepare("
            SELECT COALESCE(SUM(valor), 0) AS pagado
            FROM pagos
            WHERE venta_id = ?
        ");

        if (!$stmtPagos) {
            throw new Exception("No se pudieron consultar los pagos.");
        }

        $stmtPagos->bind_param("i", $idVenta);
        $stmtPagos->execute();

        $resultadoPagos = $stmtPagos->get_result();
        $filaPagos = $resultadoPagos->fetch_assoc();

        $pagadoActual = (float)$filaPagos["pagado"];

        $stmtPagos->close();

        $saldoActual = max(
            0,
            $total - $pagadoActual
        );

        if ($saldoActual <= 0) {
            throw new Exception("Esta venta ya está pagada.");
        }

        if ($monto > $saldoActual) {
            throw new Exception("El pago no puede ser mayor al saldo pendiente.");
        }

        /*
        Registrar el nuevo pago.
        */

        $stmtNuevoPago = $conexion->prepare("
            INSERT INTO pagos
            (
                venta_id,
                valor,
                observacion
            )
            VALUES (?, ?, ?)
        ");

        if (!$stmtNuevoPago) {
            throw new Exception("No se pudo preparar el registro del pago.");
        }

        $stmtNuevoPago->bind_param(
            "ids",
            $idVenta,
            $monto,
            $observacion
        );

        if (!$stmtNuevoPago->execute()) {
            throw new Exception("No se pudo registrar el pago.");
        }

        $stmtNuevoPago->close();

        $nuevoPagado = $pagadoActual + $monto;
        $nuevoSaldo = max(
            0,
            $total - $nuevoPagado
        );

        $nuevoEstado = $nuevoSaldo <= 0
            ? "Pagado"
            : "Pendiente";

        $conexion->commit();

        responder(
            true,
            "Pago registrado correctamente.",
            [
                "venta_id" => $idVenta,
                "total" => $total,
                "abono" => $nuevoPagado,
                "saldoPendiente" => $nuevoSaldo,
                "estadoPago" => $nuevoEstado
            ]
        );

    } catch (Exception $e) {

        $conexion->rollback();

        responder(
            false,
            $e->getMessage()
        );
    }
}

responder(
    false,
    "Acción de ventas no válida."
);