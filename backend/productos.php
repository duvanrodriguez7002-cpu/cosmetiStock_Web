<?php

header("Content-Type: application/json; charset=utf-8");

require_once "conexion.php";

$datos = json_decode(file_get_contents("php://input"), true);

$accion = $datos["accion"] ?? $_POST["accion"] ?? $_GET["accion"] ?? "";

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
        GENERAR CÓDIGO DEL PRODUCTO
=========================================
*/

function generarCodigoProducto($conexion, $categoriaId)
{
    $stmt = $conexion->prepare("
        SELECT nombre
        FROM categorias
        WHERE id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        throw new Exception("No se pudo consultar la categoría.");
    }

    $stmt->bind_param("i", $categoriaId);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $categoria = $resultado->fetch_assoc();

    $stmt->close();

    if (!$categoria) {
        throw new Exception("La categoría seleccionada no existe.");
    }

    $nombreCategoria = trim($categoria["nombre"]);

    if ($nombreCategoria === "") {
        throw new Exception("La categoría no tiene un nombre válido.");
    }

    /*
        Obtiene las primeras 3 letras de la categoría.
        Se utiliza mb_substr para soportar caracteres
        como á, é, í, ó y ú.
    */

    $prefijo = mb_strtoupper(
        mb_substr($nombreCategoria, 0, 3, "UTF-8"),
        "UTF-8"
    );

    /*
        Si la categoría tiene menos de 3 caracteres,
        se utiliza el nombre completo disponible.
    */

    if ($prefijo === "") {
        throw new Exception("No se pudo generar el prefijo de la categoría.");
    }

    /*
        Busca el siguiente número disponible.

        No utilizamos simplemente COUNT(*), porque si se
        elimina un producto podrían quedar códigos como:

        TEC-001
        TEC-003

        En ese caso el siguiente debe ser TEC-004 y no
        TEC-003, evitando cualquier duplicado.
    */

    $numero = 1;

    do {

        $codigo = $prefijo . "-" . str_pad(
            $numero,
            3,
            "0",
            STR_PAD_LEFT
        );

        $stmt = $conexion->prepare("
            SELECT id
            FROM productos
            WHERE codigo = ?
            LIMIT 1
        ");

        if (!$stmt) {
            throw new Exception("No se pudo comprobar el código.");
        }

        $stmt->bind_param("s", $codigo);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $existe = $resultado->num_rows > 0;

        $stmt->close();

        if ($existe) {
            $numero++;
        }

    } while ($existe);

    return $codigo;
}

/*
=========================================
        OBTENER / CREAR MARCA
=========================================
*/

function obtenerMarcaId($conexion, $marcaId, $nuevaMarca)
{
    $nuevaMarca = trim($nuevaMarca);

    if ($nuevaMarca !== "") {

        $stmt = $conexion->prepare("
            SELECT id
            FROM marcas
            WHERE nombre = ?
            LIMIT 1
        ");

        if (!$stmt) {
            throw new Exception("No se pudo consultar la marca.");
        }

        $stmt->bind_param("s", $nuevaMarca);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $marca = $resultado->fetch_assoc();

        $stmt->close();

        if ($marca) {
            return (int)$marca["id"];
        }

        $stmt = $conexion->prepare("
            INSERT INTO marcas
            (nombre)
            VALUES
            (?)
        ");

        if (!$stmt) {
            throw new Exception("No se pudo preparar la nueva marca.");
        }

        $stmt->bind_param("s", $nuevaMarca);

        if (!$stmt->execute()) {

            if ($stmt->errno === 1062) {

                $stmt->close();

                $stmt = $conexion->prepare("
                    SELECT id
                    FROM marcas
                    WHERE nombre = ?
                    LIMIT 1
                ");

                $stmt->bind_param("s", $nuevaMarca);
                $stmt->execute();

                $resultado = $stmt->get_result();
                $marca = $resultado->fetch_assoc();

                $stmt->close();

                if ($marca) {
                    return (int)$marca["id"];
                }
            }

            throw new Exception("No se pudo guardar la nueva marca.");
        }

        $id = $stmt->insert_id;

        $stmt->close();

        return (int)$id;
    }

    if ($marcaId > 0) {

        $stmt = $conexion->prepare("
            SELECT id
            FROM marcas
            WHERE id = ?
            LIMIT 1
        ");

        if (!$stmt) {
            throw new Exception("No se pudo comprobar la marca.");
        }

        $stmt->bind_param("i", $marcaId);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $marca = $resultado->fetch_assoc();

        $stmt->close();

        if (!$marca) {
            throw new Exception("La marca seleccionada no existe.");
        }

        return (int)$marca["id"];
    }

    return null;
}

/*
=========================================
        OBTENER / CREAR CATEGORÍA
=========================================
*/

function obtenerCategoriaId($conexion, $categoriaId, $nuevaCategoria)
{
    $nuevaCategoria = trim($nuevaCategoria);

    if ($nuevaCategoria !== "") {

        $stmt = $conexion->prepare("
            SELECT id
            FROM categorias
            WHERE nombre = ?
            LIMIT 1
        ");

        if (!$stmt) {
            throw new Exception("No se pudo consultar la categoría.");
        }

        $stmt->bind_param("s", $nuevaCategoria);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $categoria = $resultado->fetch_assoc();

        $stmt->close();

        if ($categoria) {
            return (int)$categoria["id"];
        }

        $stmt = $conexion->prepare("
            INSERT INTO categorias
            (nombre)
            VALUES
            (?)
        ");

        if (!$stmt) {
            throw new Exception("No se pudo preparar la nueva categoría.");
        }

        $stmt->bind_param("s", $nuevaCategoria);

        if (!$stmt->execute()) {

            if ($stmt->errno === 1062) {

                $stmt->close();

                $stmt = $conexion->prepare("
                    SELECT id
                    FROM categorias
                    WHERE nombre = ?
                    LIMIT 1
                ");

                $stmt->bind_param("s", $nuevaCategoria);
                $stmt->execute();

                $resultado = $stmt->get_result();
                $categoria = $resultado->fetch_assoc();

                $stmt->close();

                if ($categoria) {
                    return (int)$categoria["id"];
                }
            }

            throw new Exception("No se pudo guardar la nueva categoría.");
        }

        $id = $stmt->insert_id;

        $stmt->close();

        return (int)$id;
    }

    if ($categoriaId > 0) {

        $stmt = $conexion->prepare("
            SELECT id
            FROM categorias
            WHERE id = ?
            LIMIT 1
        ");

        if (!$stmt) {
            throw new Exception("No se pudo comprobar la categoría.");
        }

        $stmt->bind_param("i", $categoriaId);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $categoria = $resultado->fetch_assoc();

        $stmt->close();

        if (!$categoria) {
            throw new Exception("La categoría seleccionada no existe.");
        }

        return (int)$categoria["id"];
    }

    return null;
}

/*
=========================================
        GUARDAR IMAGEN DEL PRODUCTO
=========================================
*/

function guardarImagenProducto($imagen, $id)
{
    if (!$imagen) {
        return "";
    }

    if (!preg_match(
        '/^data:image\/(webp|jpeg|jpg|png);base64,/',
        $imagen
    )) {
        return "";
    }

    $imagen = preg_replace(
        '/^data:image\/(webp|jpeg|jpg|png);base64,/',
        '',
        $imagen
    );

    $imagen = str_replace(' ', '+', $imagen);

    $contenido = base64_decode($imagen);

    if ($contenido === false) {
        return "";
    }

    $carpeta = dirname(__DIR__) . "/uploads/productos/";

    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0777, true);
    }

    $nombreArchivo =
        "producto_" .
        intval($id) .
        "_" .
        time() .
        ".webp";

    $rutaFisica =
        $carpeta .
        $nombreArchivo;

    if (!file_put_contents(
        $rutaFisica,
        $contenido
    )) {
        return "";
    }

    return "uploads/productos/" . $nombreArchivo;
}

/*
=========================================
        ELIMINAR IMAGEN
=========================================
*/

function eliminarImagenProducto($ruta)
{
    if (!$ruta) {
        return;
    }

    if (
        strpos($ruta, "uploads/productos/") !== 0 ||
        strpos($ruta, "data:image") === 0
    ) {
        return;
    }

    $rutaFisica =
        dirname(__DIR__) . "/" . $ruta;

    if (file_exists($rutaFisica)) {
        unlink($rutaFisica);
    }
}

/*
=========================================
        OBTENER IMÁGENES
=========================================
*/

function obtenerImagenesProducto($conexion, $productoId)
{
    $stmt = $conexion->prepare("
        SELECT
            id,
            url_ruta,
            tipo,
            fecha_carga
        FROM imagenes
        WHERE producto_id = ?
        ORDER BY id DESC
    ");

    if (!$stmt) {
        return [];
    }

    $stmt->bind_param("i", $productoId);
    $stmt->execute();

    $resultado = $stmt->get_result();

    $imagenes = [];

    while ($imagen = $resultado->fetch_assoc()) {

        $imagenes[] = [
            "id" => (int)$imagen["id"],
            "url_ruta" => $imagen["url_ruta"],
            "tipo" => $imagen["tipo"],
            "fecha_carga" => $imagen["fecha_carga"]
        ];
    }

    $stmt->close();

    return $imagenes;
}

/*
=========================================
        LISTAR PRODUCTOS
=========================================
*/

if ($accion === "listar") {

    $sql = "
        SELECT
            p.id,
            p.codigo,
            p.nombre,
            p.marca_id,
            m.nombre AS marca,
            p.descripcion,
            p.categoria_id,
            c.nombre AS categoria,
            p.especificaciones,
            p.precio,
            p.costo,
            (p.precio - p.costo) AS ganancia,
            p.cantidad,
            p.stock_minimo,
            p.vendidos,
            p.activo,
            p.ultima_venta,
            p.fecha_creacion,
            p.fecha_actualizacion,

            (
                SELECT i.url_ruta
                FROM imagenes i
                WHERE i.producto_id = p.id
                ORDER BY i.id DESC
                LIMIT 1
            ) AS imagen

        FROM productos p

        LEFT JOIN marcas m
            ON m.id = p.marca_id

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        WHERE p.activo = 1

        ORDER BY p.id DESC
    ";

    $resultado = $conexion->query($sql);

    if (!$resultado) {
        responder(
            false,
            "No se pudieron consultar los productos."
        );
    }

    $productos = [];

    while ($producto = $resultado->fetch_assoc()) {

        $producto["id"] =
            (int)$producto["id"];

        $producto["marca_id"] =
            $producto["marca_id"] !== null
            ? (int)$producto["marca_id"]
            : null;

        $producto["categoria_id"] =
            $producto["categoria_id"] !== null
            ? (int)$producto["categoria_id"]
            : null;

        $producto["precio"] =
            (float)$producto["precio"];

        $producto["costo"] =
            (float)$producto["costo"];

        $producto["ganancia"] =
            (float)$producto["ganancia"];

        $producto["cantidad"] =
            (int)$producto["cantidad"];

        $producto["stock_minimo"] =
            (int)$producto["stock_minimo"];

        $producto["vendidos"] =
            (int)$producto["vendidos"];

        $producto["activo"] =
            (int)$producto["activo"];

        $producto["imagenes"] =
            obtenerImagenesProducto(
                $conexion,
                $producto["id"]
            );

        $productos[] =
            $producto;
    }

    responder(
        true,
        "Productos encontrados.",
        $productos
    );
}

/*
=========================================
        OBTENER PRODUCTO
=========================================
*/

if ($accion === "obtener") {

    $id =
        intval(
            $datos["id"] ?? 0
        );

    if ($id <= 0) {
        responder(
            false,
            "ID de producto no válido."
        );
    }

    $stmt = $conexion->prepare("
        SELECT
            p.id,
            p.codigo,
            p.nombre,
            p.marca_id,
            m.nombre AS marca,
            p.descripcion,
            p.categoria_id,
            c.nombre AS categoria,
            p.especificaciones,
            p.precio,
            p.costo,
            (p.precio - p.costo) AS ganancia,
            p.cantidad,
            p.stock_minimo,
            p.vendidos,
            p.activo,
            p.ultima_venta,
            p.fecha_creacion,
            p.fecha_actualizacion,

            (
                SELECT i.url_ruta
                FROM imagenes i
                WHERE i.producto_id = p.id
                ORDER BY i.id DESC
                LIMIT 1
            ) AS imagen

        FROM productos p

        LEFT JOIN marcas m
            ON m.id = p.marca_id

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        WHERE p.id = ?

        LIMIT 1
    ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar la consulta del producto."
        );
    }

    $stmt->bind_param(
        "i",
        $id
    );

    $stmt->execute();

    $resultado =
        $stmt->get_result();

    $producto =
        $resultado->fetch_assoc();

    $stmt->close();

    if (!$producto) {
        responder(
            false,
            "Producto no encontrado."
        );
    }

    $producto["id"] =
        (int)$producto["id"];

    $producto["marca_id"] =
        $producto["marca_id"] !== null
        ? (int)$producto["marca_id"]
        : null;

    $producto["categoria_id"] =
        $producto["categoria_id"] !== null
        ? (int)$producto["categoria_id"]
        : null;

    $producto["precio"] =
        (float)$producto["precio"];

    $producto["costo"] =
        (float)$producto["costo"];

    $producto["ganancia"] =
        (float)$producto["ganancia"];

    $producto["cantidad"] =
        (int)$producto["cantidad"];

    $producto["stock_minimo"] =
        (int)$producto["stock_minimo"];

    $producto["vendidos"] =
        (int)$producto["vendidos"];

    $producto["activo"] =
        (int)$producto["activo"];

    $producto["imagenes"] =
        obtenerImagenesProducto(
            $conexion,
            $id
        );

    responder(
        true,
        "Producto encontrado.",
        $producto
    );
}

/*
=========================================
        CREAR PRODUCTO
=========================================
*/

if ($accion === "crear") {

    $nombre =
        trim(
            $datos["nombre"] ?? ""
        );

    $marcaId =
        intval(
            $datos["marca_id"] ?? 0
        );

    $categoriaId =
        intval(
            $datos["categoria_id"] ?? 0
        );

    $nuevaMarca =
        trim(
            $datos["nuevaMarca"] ?? 
            $datos["nueva_marca"] ?? ""
        );

    $nuevaCategoria =
        trim(
            $datos["nuevaCategoria"] ?? 
            $datos["nueva_categoria"] ?? ""
        );

    $descripcion =
        trim(
            $datos["descripcion"] ?? ""
        );

    $especificaciones =
        trim(
            $datos["especificaciones"] ?? ""
        );

    $precio =
        floatval(
            $datos["precio"] ?? 0
        );

    $costo =
        floatval(
            $datos["costo"] ?? 0
        );

    $cantidad =
        intval(
            $datos["cantidad"] ?? 0
        );

    $stockMinimo =
        intval(
            $datos["stockMinimo"] ?? 5
        );

    $imagen =
        $datos["imagen"] ?? null;

    if ($nombre === "") {
        responder(
            false,
            "El nombre del producto es obligatorio."
        );
    }

    if ($precio < 0 || $costo < 0 || $cantidad < 0 || $stockMinimo < 0) {
        responder(
            false,
            "Los valores numéricos no pueden ser negativos."
        );
    }

    /*
        La categoría es necesaria para generar
        automáticamente el código del producto.
    */

    if (
        $categoriaId <= 0 &&
        $nuevaCategoria === ""
    ) {
        responder(
            false,
            "Debe seleccionar una categoría o registrar una nueva."
        );
    }

    $conexion->begin_transaction();

    try {

        /*
            Crear o recuperar la marca.
        */

        $marcaId = obtenerMarcaId(
            $conexion,
            $marcaId,
            $nuevaMarca
        );

        /*
            Crear o recuperar la categoría.
        */

        $categoriaId = obtenerCategoriaId(
            $conexion,
            $categoriaId,
            $nuevaCategoria
        );

        /*
            Generar código automáticamente.

            Ejemplos:

            Cosméticos  -> COS-001
            Cosméticos  -> COS-002
            Maquillaje  -> MAQ-001
            Perfumería  -> PER-001
        */

        $codigo =
            generarCodigoProducto(
                $conexion,
                $categoriaId
            );

        /*
            Insertar producto.
        */

        $stmt = $conexion->prepare("
            INSERT INTO productos
            (
                codigo,
                nombre,
                marca_id,
                descripcion,
                categoria_id,
                especificaciones,
                precio,
                costo,
                cantidad,
                stock_minimo,
                vendidos,
                activo
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                0,
                1
            )
        ");

        if (!$stmt) {
            throw new Exception(
                "No se pudo preparar el registro del producto."
            );
        }

        $stmt->bind_param(
            "ssisisddii",
            $codigo,
            $nombre,
            $marcaId,
            $descripcion,
            $categoriaId,
            $especificaciones,
            $precio,
            $costo,
            $cantidad,
            $stockMinimo
        );

        if (!$stmt->execute()) {

            if ($stmt->errno === 1062) {
                throw new Exception(
                    "El código del producto ya existe."
                );
            }

            if ($stmt->errno === 1452) {
                throw new Exception(
                    "La marca o categoría seleccionada no existe."
                );
            }

            throw new Exception(
                "No se pudo crear el producto."
            );
        }

        $idProducto =
            $stmt->insert_id;

        $stmt->close();

        /*
            Guardar imagen.
        */

        if (!empty($imagen)) {

            $rutaImagen =
                guardarImagenProducto(
                    $imagen,
                    $idProducto
                );

            if ($rutaImagen !== "") {

                $stmtImagen =
                    $conexion->prepare("
                        INSERT INTO imagenes
                        (
                            producto_id,
                            url_ruta,
                            tipo
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            'imagen'
                        )
                    ");

                if ($stmtImagen) {

                    $stmtImagen->bind_param(
                        "is",
                        $idProducto,
                        $rutaImagen
                    );

                    $stmtImagen->execute();

                    $stmtImagen->close();
                }
            }
        }

        $conexion->commit();

        responder(
            true,
            "Producto creado correctamente.",
            [
                "id" =>
                    $idProducto,

                "codigo" =>
                    $codigo,

                "marca_id" =>
                    $marcaId,

                "categoria_id" =>
                    $categoriaId
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
        EDITAR PRODUCTO
=========================================
*/

if ($accion === "editar") {

    $id =
        intval(
            $datos["id"] ?? 0
        );

    $codigo =
        trim(
            $datos["codigo"] ?? ""
        );

    $nombre =
        trim(
            $datos["nombre"] ?? ""
        );

    $marcaId =
        intval(
            $datos["marca_id"] ?? 0
        );

    $categoriaId =
        intval(
            $datos["categoria_id"] ?? 0
        );

    $descripcion =
        trim(
            $datos["descripcion"] ?? ""
        );

    $especificaciones =
        trim(
            $datos["especificaciones"] ?? ""
        );

    $precio =
        floatval(
            $datos["precio"] ?? 0
        );

    $costo =
        floatval(
            $datos["costo"] ?? 0
        );

    $cantidad =
        intval(
            $datos["cantidad"] ?? 0
        );

    $stockMinimo =
        intval(
            $datos["stockMinimo"] ?? 5
        );

    $imagen =
        $datos["imagen"] ?? null;

    if ($id <= 0) {
        responder(
            false,
            "ID de producto no válido."
        );
    }

    if ($codigo === "") {
        responder(
            false,
            "El código del producto es obligatorio."
        );
    }

    if ($nombre === "") {
        responder(
            false,
            "El nombre del producto es obligatorio."
        );
    }

    if ($precio < 0 || $costo < 0 || $cantidad < 0 || $stockMinimo < 0) {
        responder(
            false,
            "Los valores numéricos no pueden ser negativos."
        );
    }

    if ($marcaId <= 0) {
        $marcaId = null;
    }

    if ($categoriaId <= 0) {
        $categoriaId = null;
    }

    $stmt =
        $conexion->prepare("
            UPDATE productos
            SET
                codigo = ?,
                nombre = ?,
                marca_id = ?,
                descripcion = ?,
                categoria_id = ?,
                especificaciones = ?,
                precio = ?,
                costo = ?,
                cantidad = ?,
                stock_minimo = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
        ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar la actualización del producto."
        );
    }

    $stmt->bind_param(
        "ssisisdiiii",
        $codigo,
        $nombre,
        $marcaId,
        $descripcion,
        $categoriaId,
        $especificaciones,
        $precio,
        $costo,
        $cantidad,
        $stockMinimo,
        $id
    );

    if (!$stmt->execute()) {

        if ($stmt->errno === 1062) {
            responder(
                false,
                "El código del producto ya existe."
            );
        }

        if ($stmt->errno === 1452) {
            responder(
                false,
                "La marca o categoría seleccionada no existe."
            );
        }

        responder(
            false,
            "No se pudo actualizar el producto."
        );
    }

    $stmt->close();

    if (
        !empty($imagen) &&
        strpos($imagen, "data:image/") === 0
    ) {

        $rutaNueva =
            guardarImagenProducto(
                $imagen,
                $id
            );

        if ($rutaNueva === "") {
            responder(
                false,
                "No se pudo guardar la nueva imagen."
            );
        }

        $stmtImagen =
            $conexion->prepare("
                INSERT INTO imagenes
                (
                    producto_id,
                    url_ruta,
                    tipo
                )
                VALUES
                (
                    ?,
                    ?,
                    'imagen'
                )
            ");

        if (!$stmtImagen) {
            responder(
                false,
                "No se pudo registrar la nueva imagen."
            );
        }

        $stmtImagen->bind_param(
            "is",
            $id,
            $rutaNueva
        );

        if (!$stmtImagen->execute()) {
            responder(
                false,
                "No se pudo registrar la nueva imagen."
            );
        }

        $stmtImagen->close();
    }

    responder(
        true,
        "Producto actualizado correctamente."
    );
}

/*
=========================================
        ELIMINAR PRODUCTO
=========================================
*/

if ($accion === "eliminar") {

    $id =
        intval(
            $datos["id"] ?? 0
        );

    if ($id <= 0) {
        responder(
            false,
            "ID de producto no válido."
        );
    }

    $stmt =
        $conexion->prepare("
            SELECT
                id,
                nombre
            FROM productos
            WHERE id = ?
            LIMIT 1
        ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo comprobar el producto."
        );
    }

    $stmt->bind_param(
        "i",
        $id
    );

    $stmt->execute();

    $resultado =
        $stmt->get_result();

    $producto =
        $resultado->fetch_assoc();

    $stmt->close();

    if (!$producto) {
        responder(
            false,
            "Producto no encontrado."
        );
    }

    $stmt =
        $conexion->prepare("
            SELECT
                COUNT(*) AS total
            FROM detalle_ventas
            WHERE producto_id = ?
        ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo comprobar el historial de ventas."
        );
    }

    $stmt->bind_param(
        "i",
        $id
    );

    $stmt->execute();

    $resultado =
        $stmt->get_result();

    $venta =
        $resultado->fetch_assoc();

    $stmt->close();

    $tieneVentas =
        intval(
            $venta["total"] ?? 0
        ) > 0;

    if ($tieneVentas) {

        $stmt =
            $conexion->prepare("
                UPDATE productos
                SET
                    activo = 0,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?
            ");

        if (!$stmt) {
            responder(
                false,
                "No se pudo preparar la desactivación."
            );
        }

        $stmt->bind_param(
            "i",
            $id
        );

        if (!$stmt->execute()) {
            responder(
                false,
                "No se pudo desactivar el producto."
            );
        }

        $stmt->close();

        responder(
            true,
            "El producto tenía ventas registradas y fue desactivado.",
            [
                "accion" => "desactivado",
                "id" => $id,
                "nombre" => $producto["nombre"]
            ]
        );
    }

    $stmtImagenes =
        $conexion->prepare("
            SELECT
                url_ruta
            FROM imagenes
            WHERE producto_id = ?
        ");

    $imagenesEliminar = [];

    if ($stmtImagenes) {

        $stmtImagenes->bind_param(
            "i",
            $id
        );

        $stmtImagenes->execute();

        $resultadoImagenes =
            $stmtImagenes->get_result();

        while (
            $imagenEliminar =
            $resultadoImagenes->fetch_assoc()
        ) {

            $imagenesEliminar[] =
                $imagenEliminar["url_ruta"];
        }

        $stmtImagenes->close();
    }

    $stmt =
        $conexion->prepare("
            DELETE FROM productos
            WHERE id = ?
        ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar la eliminación."
        );
    }

    $stmt->bind_param(
        "i",
        $id
    );

    if (!$stmt->execute()) {

        if ($stmt->errno === 1451) {
            responder(
                false,
                "El producto tiene registros relacionados y no puede eliminarse."
            );
        }

        responder(
            false,
            "No se pudo eliminar el producto."
        );
    }

    $stmt->close();

    foreach (
        $imagenesEliminar as $rutaImagen
    ) {

        eliminarImagenProducto(
            $rutaImagen
        );
    }

    responder(
        true,
        "El producto fue eliminado permanentemente.",
        [
            "accion" => "eliminado",
            "id" => $id,
            "nombre" => $producto["nombre"]
        ]
    );
}

/*
=========================================
        IMPORTAR INVENTARIO
=========================================
*/

if ($accion === "importar_inventario") {

    $productos = $datos["productos"] ?? [];
    $clientes = $datos["clientes"] ?? [];
    $ventas = $datos["ventas"] ?? [];
    $actividades = $datos["actividad"] ?? [];

    if (!is_array($productos)) {
        responder(
            false,
            "La información de productos no es válida."
        );
    }

    if (!is_array($clientes)) {
        responder(
            false,
            "La información de clientes no es válida."
        );
    }

    if (!is_array($ventas)) {
        responder(
            false,
            "La información de ventas no es válida."
        );
    }

    $conexion->begin_transaction();

    try {

        /*
        =========================================
            1. OBTENER IMÁGENES ACTUALES
        =========================================
        */

        $rutasImagenes = [];

        $resultadoImagenes = $conexion->query("
            SELECT url_ruta
            FROM imagenes
        ");

        if ($resultadoImagenes) {

            while ($imagen = $resultadoImagenes->fetch_assoc()) {

                if (!empty($imagen["url_ruta"])) {

                    $rutasImagenes[] =
                        $imagen["url_ruta"];
                }
            }
        }

        /*
        =========================================
            2. LIMPIAR INFORMACIÓN ACTUAL
        =========================================
        */

        $tablas = [
            "detalle_ventas",
            "pagos",
            "ventas",
            "actividades",
            "imagenes",
            "productos",
            "clientes",
            "categorias",
            "marcas"
        ];

        foreach ($tablas as $tabla) {

            if (!$conexion->query(
                "DELETE FROM $tabla"
            )) {

                throw new Exception(
                    "No se pudo limpiar la tabla: " . $tabla
                );
            }
        }

        /*
        =========================================
            3. REINICIAR AUTO_INCREMENT
        =========================================
        */

        foreach ($tablas as $tabla) {

            if (!$conexion->query(
                "ALTER TABLE $tabla AUTO_INCREMENT = 1"
            )) {

                throw new Exception(
                    "No se pudo reiniciar la tabla: " . $tabla
                );
            }
        }

        /*
        =========================================
            4. MARCAS Y CATEGORÍAS
        =========================================
        */

        $marcas = [];
        $categorias = [];

        foreach ($productos as $producto) {

            if (
                !empty($producto["marca_id"]) &&
                !empty($producto["marca"])
            ) {

                $marcas[
                    (int)$producto["marca_id"]
                ] = trim(
                    $producto["marca"]
                );
            }

            if (
                !empty($producto["categoria_id"]) &&
                !empty($producto["categoria"])
            ) {

                $categorias[
                    (int)$producto["categoria_id"]
                ] = trim(
                    $producto["categoria"]
                );
            }
        }

        foreach ($marcas as $id => $nombre) {

            $stmt = $conexion->prepare("
                INSERT INTO marcas
                (id, nombre)
                VALUES
                (?, ?)
            ");

            if (!$stmt) {
                throw new Exception(
                    "No se pudo preparar la importación de marcas."
                );
            }

            $stmt->bind_param(
                "is",
                $id,
                $nombre
            );

            if (!$stmt->execute()) {

                throw new Exception(
                    "No se pudo importar la marca: " . $nombre
                );
            }

            $stmt->close();
        }

        foreach ($categorias as $id => $nombre) {

            $stmt = $conexion->prepare("
                INSERT INTO categorias
                (id, nombre)
                VALUES
                (?, ?)
            ");

            if (!$stmt) {
                throw new Exception(
                    "No se pudo preparar la importación de categorías."
                );
            }

            $stmt->bind_param(
                "is",
                $id,
                $nombre
            );

            if (!$stmt->execute()) {

                throw new Exception(
                    "No se pudo importar la categoría: " . $nombre
                );
            }

            $stmt->close();
        }

        /*
        =========================================
            5. IMPORTAR CLIENTES
        =========================================
        */

        foreach ($clientes as $cliente) {

            $id =
                intval(
                    $cliente["id"] ?? 0
                );

            $nombre =
                trim(
                    $cliente["nombre"] ?? ""
                );

            $apellido =
                trim(
                    $cliente["apellido"] ?? ""
                );

            $telefono =
                $cliente["telefono"] ?? "";

            $correo =
                $cliente["correo"] ?? "";

            $direccion =
                $cliente["direccion"] ?? "";

            $activo =
                isset($cliente["activo"])
                ? intval($cliente["activo"])
                : 1;

            $fechaCreacion =
                $cliente["fecha_creacion"] ??
                null;

            if ($id <= 0 || $nombre === "") {
                continue;
            }

            $stmt = $conexion->prepare("
                INSERT INTO clientes
                (
                    id,
                    nombre,
                    apellido,
                    telefono,
                    correo,
                    direccion,
                    activo,
                    fecha_creacion
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            if (!$stmt) {
                throw new Exception(
                    "No se pudo preparar la importación de clientes."
                );
            }

            $stmt->bind_param(
                "isssssis",
                $id,
                $nombre,
                $apellido,
                $telefono,
                $correo,
                $direccion,
                $activo,
                $fechaCreacion
            );

            if (!$stmt->execute()) {

                throw new Exception(
                    "No se pudo importar el cliente: " .
                    $nombre . " " . $apellido
                );
            }

            $stmt->close();
        }

        /*
        =========================================
            6. IMPORTAR PRODUCTOS
        =========================================
        */

        foreach ($productos as $producto) {

            $id =
                intval(
                    $producto["id"] ?? 0
                );

            $codigo =
                trim(
                    $producto["codigo"] ?? ""
                );

            $nombre =
                trim(
                    $producto["nombre"] ?? ""
                );

            $marcaId =
                !empty($producto["marca_id"])
                ? intval($producto["marca_id"])
                : null;

            $descripcion =
                $producto["descripcion"] ?? "";

            $categoriaId =
                !empty($producto["categoria_id"])
                ? intval($producto["categoria_id"])
                : null;

            $especificaciones =
                $producto["especificaciones"] ?? "";

            $precio =
                floatval(
                    $producto["precio"] ?? 0
                );

            $costo =
                floatval(
                    $producto["costo"] ?? 0
                );

            $cantidad =
                intval(
                    $producto["cantidad"] ?? 0
                );

            $stockMinimo =
                isset($producto["stock_minimo"])
                ? intval($producto["stock_minimo"])
                : intval(
                    $producto["stockMinimo"] ?? 5
                );

            $vendidos =
                intval(
                    $producto["vendidos"] ?? 0
                );

            $activo =
                !empty($producto["activo"])
                ? 1
                : 0;

            $ultimaVenta =
                $producto["ultima_venta"] ?? null;

            $fechaCreacion =
                $producto["fecha_creacion"] ?? null;

            $fechaActualizacion =
                $producto["fecha_actualizacion"] ?? null;

            if (
                $id <= 0 ||
                $codigo === "" ||
                $nombre === ""
            ) {

                continue;
            }

            $stmt = $conexion->prepare("
                INSERT INTO productos
                (
                    id,
                    codigo,
                    nombre,
                    marca_id,
                    descripcion,
                    categoria_id,
                    especificaciones,
                    precio,
                    costo,
                    cantidad,
                    stock_minimo,
                    vendidos,
                    activo,
                    ultima_venta,
                    fecha_creacion,
                    fecha_actualizacion
                )
                VALUES
                (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            ");

            if (!$stmt) {
                throw new Exception(
                    "No se pudo preparar la importación de productos."
                );
            }

            $stmt->bind_param(
                "issisissddiiisss",
                $id,
                $codigo,
                $nombre,
                $marcaId,
                $descripcion,
                $categoriaId,
                $especificaciones,
                $precio,
                $costo,
                $cantidad,
                $stockMinimo,
                $vendidos,
                $activo,
                $ultimaVenta,
                $fechaCreacion,
                $fechaActualizacion
            );

            if (!$stmt->execute()) {

                throw new Exception(
                    "No se pudo importar el producto: " .
                    $nombre .
                    ". Error: " .
                    $stmt->error
                );
            }

            $stmt->close();

            /*
            =========================================
                IMPORTAR IMÁGENES DEL PRODUCTO
            =========================================
            */

            if (
                !empty($producto["imagenes"]) &&
                is_array($producto["imagenes"])
            ) {

                foreach (
                    $producto["imagenes"]
                    as $imagen
                ) {

                    $imagenId =
                        intval(
                            $imagen["id"] ?? 0
                        );

                    $url =
                        $imagen["url_ruta"] ?? "";

                    $tipo =
                        $imagen["tipo"] ?? "imagen";

                    $fechaCarga =
                        $imagen["fecha_carga"] ?? null;

                    if (
                        $imagenId <= 0 ||
                        $url === ""
                    ) {
                        continue;
                    }

                    $stmtImagen =
                        $conexion->prepare("
                            INSERT INTO imagenes
                            (
                                id,
                                producto_id,
                                url_ruta,
                                tipo,
                                fecha_carga
                            )
                            VALUES
                            (?, ?, ?, ?, ?)
                        ");

                    if (!$stmtImagen) {
                        throw new Exception(
                            "No se pudo preparar la importación de imágenes."
                        );
                    }

                    $stmtImagen->bind_param(
                        "iisss",
                        $imagenId,
                        $id,
                        $url,
                        $tipo,
                        $fechaCarga
                    );

                    if (!$stmtImagen->execute()) {

                        throw new Exception(
                            "No se pudo importar una imagen del producto: " .
                            $nombre
                        );
                    }

                    $stmtImagen->close();
                }
            }
        }

        /*
        =========================================
            7. IMPORTAR VENTAS
        =========================================
        */

        foreach ($ventas as $venta) {

            $ventaId =
                intval(
                    $venta["id"] ?? 0
                );

            $clienteId =
                !empty($venta["cliente_id"])
                ? intval($venta["cliente_id"])
                : null;

            $fecha =
                $venta["fecha"] ?? null;

            $metodoPago =
                $venta["metodoPago"] ??
                $venta["metodo_pago"] ??
                "contado";

            $descuento =
                floatval(
                    $venta["descuento"] ?? 0
                );

            $fechaCredito =
                $venta["fechaCredito"] ??
                $venta["fecha_credito"] ??
                null;

            if ($ventaId <= 0) {
                continue;
            }

            $stmt = $conexion->prepare("
                INSERT INTO ventas
                (
                    id,
                    cliente_id,
                    fecha,
                    metodo_pago,
                    descuento,
                    fecha_credito
                )
                VALUES
                (?, ?, ?, ?, ?, ?)
            ");

            if (!$stmt) {
                throw new Exception(
                    "No se pudo preparar la importación de ventas."
                );
            }

            $stmt->bind_param(
                "iissds",
                $ventaId,
                $clienteId,
                $fecha,
                $metodoPago,
                $descuento,
                $fechaCredito
            );

            if (!$stmt->execute()) {

                throw new Exception(
                    "No se pudo importar la venta #" .
                    $ventaId .
                    ": " .
                    $stmt->error
                );
            }

            $stmt->close();

            /*
            =========================================
                DETALLES DE LA VENTA
            =========================================
            */

            if (
                !empty($venta["productos"]) &&
                is_array($venta["productos"])
            ) {

                foreach (
                    $venta["productos"]
                    as $detalle
                ) {

                    $productoId =
                        intval(
                            $detalle["producto_id"] ?? 0
                        );

                    $cantidad =
                        intval(
                            $detalle["cantidad"] ?? 0
                        );

                    $precioUnitario =
                        floatval(
                            $detalle["precio"] ??
                            $detalle["precio_unitario"] ??
                            0
                        );

                    $subtotal =
                        floatval(
                            $detalle["subtotal"] ?? 0
                        );

                    $ganancia =
                        floatval(
                            $detalle["ganancia"] ?? 0
                        );

                    if (
                        $productoId <= 0 ||
                        $cantidad <= 0
                    ) {
                        continue;
                    }

                    $stmtDetalle =
                        $conexion->prepare("
                            INSERT INTO detalle_ventas
                            (
                                venta_id,
                                producto_id,
                                cantidad,
                                precio_unitario,
                                subtotal,
                                ganancia
                            )
                            VALUES
                            (?, ?, ?, ?, ?, ?)
                        ");

                    if (!$stmtDetalle) {
                        throw new Exception(
                            "No se pudo preparar el detalle de venta."
                        );
                    }

                    $stmtDetalle->bind_param(
                        "iiiddd",
                        $ventaId,
                        $productoId,
                        $cantidad,
                        $precioUnitario,
                        $subtotal,
                        $ganancia
                    );

                    if (!$stmtDetalle->execute()) {

                        throw new Exception(
                            "No se pudo importar un detalle de la venta #" .
                            $ventaId .
                            ": " .
                            $stmtDetalle->error
                        );
                    }

                    $stmtDetalle->close();
                }
            }

            /*
            =========================================
                IMPORTAR PAGO
            =========================================
            */

            $abono =
                floatval(
                    $venta["abono"] ?? 0
                );

            if ($abono > 0) {

                $stmtPago =
                    $conexion->prepare("
                        INSERT INTO pagos
                        (
                            venta_id,
                            valor,
                            fecha,
                            observacion
                        )
                        VALUES
                        (?, ?, ?, ?)
                    ");

                if (!$stmtPago) {
                    throw new Exception(
                        "No se pudo preparar el pago."
                    );
                }

                $observacion =
                    "Pago importado desde inventario JSON";

                $stmtPago->bind_param(
                    "idss",
                    $ventaId,
                    $abono,
                    $fecha,
                    $observacion
                );

                if (!$stmtPago->execute()) {

                    throw new Exception(
                        "No se pudo importar el pago de la venta #" .
                        $ventaId
                    );
                }

                $stmtPago->close();
            }
        }

        /*
        =========================================
            8. IMPORTAR ACTIVIDADES
        =========================================
        */

        if (is_array($actividades)) {

            foreach ($actividades as $actividad) {

                $actividadId =
                    intval(
                        $actividad["id"] ?? 0
                    );

                $tipo =
                    $actividad["tipo"] ?? "";

                $descripcion =
                    $actividad["descripcion"] ?? "";

                $clienteId =
                    !empty($actividad["cliente_id"])
                    ? intval($actividad["cliente_id"])
                    : null;

                $ventaId =
                    !empty($actividad["venta_id"])
                    ? intval($actividad["venta_id"])
                    : null;

                $productoId =
                    !empty($actividad["producto_id"])
                    ? intval($actividad["producto_id"])
                    : null;

                $imagenId =
                    !empty($actividad["imagen_id"])
                    ? intval($actividad["imagen_id"])
                    : null;

                $pagoId =
                    !empty($actividad["pago_id"])
                    ? intval($actividad["pago_id"])
                    : null;

                $fecha =
                    $actividad["fecha"] ?? null;

                if (
                    $actividadId <= 0 ||
                    $tipo === ""
                ) {
                    continue;
                }

                $stmtActividad =
                    $conexion->prepare("
                        INSERT INTO actividades
                        (
                            id,
                            tipo,
                            descripcion,
                            cliente_id,
                            venta_id,
                            producto_id,
                            imagen_id,
                            pago_id,
                            fecha
                        )
                        VALUES
                        (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");

                if (!$stmtActividad) {
                    throw new Exception(
                        "No se pudo preparar la actividad."
                    );
                }

                $stmtActividad->bind_param(
                    "issiiiiis",
                    $actividadId,
                    $tipo,
                    $descripcion,
                    $clienteId,
                    $ventaId,
                    $productoId,
                    $imagenId,
                    $pagoId,
                    $fecha
                );

                if (!$stmtActividad->execute()) {

                    throw new Exception(
                        "No se pudo importar una actividad."
                    );
                }

                $stmtActividad->close();
            }
        }

        /*
        =========================================
            9. REGISTRAR IMPORTACIÓN
        =========================================
        */

        $tipoActividad = "Importación";

        $descripcionActividad =
            "Se importó un inventario desde un archivo JSON";

        $stmtActividad =
            $conexion->prepare("
                INSERT INTO actividades
                (
                    tipo,
                    descripcion,
                    fecha
                )
                VALUES
                (?, ?, CURRENT_TIMESTAMP)
            ");

        if ($stmtActividad) {

            $stmtActividad->bind_param(
                "ss",
                $tipoActividad,
                $descripcionActividad
            );

            $stmtActividad->execute();

            $stmtActividad->close();
        }

        /*
        =========================================
            10. CONFIRMAR
        =========================================
        */

        $conexion->commit();

        /*
        =========================================
            11. ELIMINAR IMÁGENES ANTIGUAS
        =========================================
        */

        foreach ($rutasImagenes as $rutaImagen) {

            eliminarImagenProducto(
                $rutaImagen
            );
        }

        /*
        =========================================
            12. DEVOLVER INFORMACIÓN
        =========================================
        */

        responder(
            true,
            "Inventario importado correctamente.",
            [
                "productos" => $productos,
                "clientes" => $clientes,
                "ventas" => $ventas,
                "actividad" => $actividades
            ]
        );

    }
    catch (Exception $e) {

        $conexion->rollback();

        responder(
            false,
            "No se pudo importar el inventario: " .
            $e->getMessage()
        );
    }
}

/*
=========================================
        ACTUALIZAR STOCK
=========================================
*/

if ($accion === "actualizar_stock") {

    $id =
        intval(
            $datos["id"] ?? 0
        );

    $cantidad =
        intval(
            $datos["cantidad"] ?? 0
        );

    if (
        $id <= 0 ||
        $cantidad < 0
    ) {
        responder(
            false,
            "Datos de inventario no válidos."
        );
    }

    $stmt =
        $conexion->prepare("
            UPDATE productos
            SET
                cantidad = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
        ");

    if (!$stmt) {
        responder(
            false,
            "No se pudo preparar la actualización del inventario."
        );
    }

    $stmt->bind_param(
        "ii",
        $cantidad,
        $id
    );

    if (!$stmt->execute()) {
        responder(
            false,
            "No se pudo actualizar el inventario."
        );
    }

    $stmt->close();

    responder(
        true,
        "Inventario actualizado correctamente."
    );
}

/*
=========================================
        VACIAR BASE DE DATOS
=========================================
*/

if ($accion === "vaciar_base_datos") {

    $conexion->begin_transaction();

    try {

        /*
        =========================================
            1. OBTENER RUTAS DE TODAS LAS IMÁGENES
        =========================================
        */

        $rutasImagenes = [];

        $resultadoImagenes = $conexion->query("
            SELECT url_ruta
            FROM imagenes
        ");

        if ($resultadoImagenes) {

            while ($imagen = $resultadoImagenes->fetch_assoc()) {

                if (!empty($imagen["url_ruta"])) {
                    $rutasImagenes[] = $imagen["url_ruta"];
                }
            }
        }

        /*
        =========================================
            2. ELIMINAR INFORMACIÓN DE LAS TABLAS
        =========================================
        */

        $tablas = [
            "detalle_ventas",
            "pagos",
            "ventas",
            "actividades",
            "imagenes",
            "productos",
            "clientes",
            "categorias",
            "marcas"
        ];

        foreach ($tablas as $tabla) {

            if (!$conexion->query(
                "DELETE FROM $tabla"
            )) {
                throw new Exception(
                    "No se pudo limpiar la tabla: " . $tabla
                );
            }
        }

        /*
        =========================================
            3. REINICIAR AUTO_INCREMENT
        =========================================
        */

        $tablasAutoIncrement = [
            "detalle_ventas",
            "pagos",
            "ventas",
            "actividades",
            "imagenes",
            "productos",
            "clientes",
            "categorias",
            "marcas"
        ];

        foreach ($tablasAutoIncrement as $tabla) {

            $conexion->query(
                "ALTER TABLE $tabla AUTO_INCREMENT = 1"
            );
        }

        /*
        =========================================
            4. CONFIRMAR CAMBIOS DE MYSQL
        =========================================
        */

        $conexion->commit();

        /*
        =========================================
            5. ELIMINAR ARCHIVOS FÍSICOS
               DE LAS IMÁGENES
        =========================================
        */

        foreach ($rutasImagenes as $rutaImagen) {

            eliminarImagenProducto(
                $rutaImagen
            );
        }

        responder(
            true,
            "Toda la información y las imágenes fueron eliminadas correctamente."
        );

    } catch (Exception $e) {

        $conexion->rollback();

        responder(
            false,
            "No se pudo limpiar la base de datos: " .
            $e->getMessage()
        );
    }
}