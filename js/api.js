/*
=========================================
            API.JS
    Comunicación con el backend
=========================================
*/

/* Configuración de la comunicación con el backend */
const API_URL = "backend/";

/* Envía una petición al PHP correspondiente y devuelve la respuesta JSON */
async function enviarPeticion(archivo, datos = {}){

    const inicio = performance.now();

    try{

        const respuesta = await fetch(
            API_URL + archivo,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            }
        );

        const resultado = await respuesta.json();

        const tiempo =
            performance.now() - inicio;

        console.log(
            `⏱️ ${archivo} (${datos.accion}): ${tiempo.toFixed(0)} ms`
        );

        if(!resultado.ok){

            throw new Error(
                resultado.mensaje ||
                "El servidor rechazó la operación."
            );

        }

        return resultado;

    }catch(error){

        const tiempo =
            performance.now() - inicio;

        console.error(
            `❌ ${archivo} (${datos.accion}) falló después de ${tiempo.toFixed(0)} ms`,
            error
        );

        throw error;

    }

}

/*=========================================
            PRODUCTOS
=========================================*/

/* Obtiene todos los productos activos desde MySQL */
async function listarProductos(){

    console.trace("📡 listarProductos() fue llamado");

    return await enviarPeticion(
        "productos.php",
        {
            accion: "listar"
        }
    );

}

/* Obtiene un producto específico mediante su ID */
async function obtenerProducto(id){

    return await enviarPeticion(
        "productos.php",
        {
            accion: "obtener",
            id: id
        }
    );

}

/* Registra un producto nuevo en MySQL */
async function crearProducto(producto){

    return await enviarPeticion(
        "productos.php",
        {
            accion: "crear",
            ...producto
        }
    );

}

/* Actualiza la información de un producto existente */
async function editarProducto(producto){

    return await enviarPeticion(
        "productos.php",
        {
            accion: "editar",
            ...producto
        }
    );

}

/* Elimina físicamente o desactiva un producto según su historial de ventas */
async function eliminarProductoAPI(id){

    return await enviarPeticion(
        "productos.php",
        {
            accion: "eliminar",
            id: id
        }
    );

}

/* Actualiza únicamente la cantidad disponible */
async function actualizarStock(id, cantidad){

    return await enviarPeticion(
        "productos.php",
        {
            accion: "actualizar_stock",
            id: id,
            cantidad: cantidad
        }
    );

}

/* Vacía las cantidades del inventario sin eliminar productos ni ventas */
async function vaciarInventario(){

    return await enviarPeticion(
        "productos.php",
        {
            accion: "vaciar_inventario"
        }
    );

}


/*=========================================
        MARCAS Y CATEGORÍAS
=========================================*/

/* Obtiene todas las marcas desde MySQL */
async function listarMarcas(){

    return await enviarPeticion(
        "marcas.php",
        {
            accion: "listar"
        }
    );

}

/* Obtiene todas las categorías desde MySQL */
async function listarCategorias(){

    return await enviarPeticion(
        "categorias.php",
        {
            accion: "listar"
        }
    );

}


/*=========================================
            CLIENTES
=========================================*/

/* Obtiene todos los clientes activos desde MySQL */
async function listarClientes(){

    return await enviarPeticion(
        "clientes.php",
        {
            accion: "listar"
        }
    );

}

/* Obtiene un cliente específico mediante su ID */
async function obtenerClienteAPI(id){

    return await enviarPeticion(
        "clientes.php",
        {
            accion: "obtener",
            id: id
        }
    );

}

/* Registra un nuevo cliente en MySQL */
async function crearClienteAPI(cliente){

    return await enviarPeticion(
        "clientes.php",
        {
            accion: "crear",
            ...cliente
        }
    );

}

/* Actualiza la información de un cliente existente */
async function editarClienteAPI(cliente){

    return await enviarPeticion(
        "clientes.php",
        {
            accion: "editar",
            ...cliente
        }
    );

}

/* Desactiva un cliente sin eliminar su historial */
async function desactivarClienteAPI(id){

    return await enviarPeticion(
        "clientes.php",
        {
            accion: "desactivar",
            id: id
        }
    );

}

/* Elimina un cliente si no tiene ventas o lo desactiva si tiene historial */
async function eliminarClienteAPI(id){

    return await enviarPeticion(
        "clientes.php",
        {
            accion: "eliminar",
            id: id
        }
    );

}


/*=========================================
            VENTAS
=========================================*/

/* Registra una venta en MySQL */
async function registrarVentaAPI(venta){

    const clienteId =
        venta.cliente?.id
        ? Number(venta.cliente.id)
        : null;

    return await enviarPeticion(
        "ventas.php",
        {
            accion: "registrar",

            cliente_id:
                clienteId,

            subtotal:
                Number(venta.subtotal) || 0,

            descuento:
                Number(venta.descuento) || 0,

            total:
                Number(venta.total) || 0,

            ganancia:
                Number(venta.ganancia) || 0,

            metodo_pago:
                venta.metodoPago || "contado",

            abono:
                Number(venta.abono) || 0,

            fecha_credito:
                venta.fechaCredito || null,

            detalles:
                Array.isArray(venta.productos)
                    ? venta.productos
                    : []
        }
    );

}

/* Obtiene todas las ventas desde MySQL */
async function listarVentas(){

    return await enviarPeticion(
        "ventas.php",
        {
            accion: "listar"
        }
    );

}

/* Obtiene una venta específica */
async function obtenerVentaAPI(id){

    return await enviarPeticion(
        "ventas.php",
        {
            accion: "obtener",
            id: id
        }
    );

}

/* Registra un pago sobre una venta existente en MySQL */
async function registrarPagoAPI(idVenta, monto){

    return await enviarPeticion(
        "ventas.php",
        {
            accion: "registrar_pago",
            id: Number(idVenta),
            monto: Number(monto) || 0
        }
    );

}


/*=========================================
            ACTIVIDADES
=========================================*/

/* Obtiene las actividades desde MySQL */
async function listarActividades(limite = 12){

    return await enviarPeticion(
        "actividades.php",
        {
            accion: "listar",
            limite: limite
        }
    );

}

/* Registra una actividad en MySQL */
async function registrarActividadAPI(actividad){

    return await enviarPeticion(
        "actividades.php",
        {
            accion: "registrar",

            tipo:
                actividad.tipo || "",

            descripcion:
                actividad.descripcion || "",

            cliente_id:
                actividad.cliente_id || null,

            venta_id:
                actividad.venta_id || null,

            producto_id:
                actividad.producto_id || null,

            imagen_id:
                actividad.imagen_id || null,

            pago_id:
                actividad.pago_id || null
        }
    );

}


/*=========================================
            CONFIRMACIÓN
=========================================*/

console.log(
    "api.js cargado correctamente."
);