/*
=========================================
            DATABASE.JS
        Base de datos principal
=========================================
*/

/*
=========================================
        MEMORIA PRINCIPAL
=========================================
*/

let db = {

    productos: [],

    clientes: [],

    ventas: [],

    actividad: []

};

/*
=========================================
        MODELO DE PRODUCTO LOCAL
=========================================
*/

/*
Crea un producto para operaciones locales del frontend.
La comunicación con MySQL se realiza exclusivamente mediante api.js.
*/
function crearProductoLocal(){

    return {

        id: generarID(),

        codigo: "",

        nombre: "",

        marca: "",

        categoria: "Cosméticos",

        descripcion: "",

        especificaciones: "",

        imagen: "",

        cantidad: 0,

        stockMinimo: 5,

        costo: 0,

        precio: 0,

        ganancia: 0,

        vendidos: 0,

        fechaCreacion: obtenerFecha(),

        fechaActualizacion: obtenerFecha(),

        ultimaVenta: "",

        activo: true

    };

}

/*
=========================================
            MODELO DE VENTA
=========================================
*/

function crearVenta(){

    return {

        id: generarID(),

        fecha: obtenerFecha(),

        hora: new Date().toLocaleTimeString(),

        cliente: null,

        metodoPago: "Contado",

        estadoPago: "Pagado",

        observacion: "",

        productos: [],

        cantidadProductos: 0,

        total: 0,

        ganancia: 0,

        abono: 0,

        saldoPendiente: 0

    };

}

/*
=========================================
        MODELO DE CLIENTE
=========================================
*/

function crearCliente(){

    return {

        id: generarID(),

        nombre: "",

        apellido: "",

        telefono: "",

        correo: "",

        direccion: "",

        fechaRegistro: obtenerFecha(),

        activo: true

    };

}

/*
=========================================
        PRODUCTO POR ID
=========================================
*/

/*
Obtiene un producto almacenado actualmente
en la memoria del frontend.
*/
function obtenerProductoLocal(id){

    return db.productos.find(

        producto =>
            String(producto.id) === String(id)

    );

}

/*
=========================================
        ELIMINAR PRODUCTO LOCAL
=========================================
*/

function eliminarProductoDB(id){

    db.productos = db.productos.filter(

        producto =>
            String(producto.id) !== String(id)

    );

}

/*
=========================================
        AGREGAR PRODUCTO LOCAL
=========================================
*/

function agregarProductoDB(producto){

    if(!producto){

        return false;

    }

    db.productos.push(producto);

    return true;

}

/*
=========================================
        AGREGAR CLIENTE
=========================================
*/

function agregarClienteDB(cliente){

    if(!cliente){

        return false;

    }

    db.clientes.push(cliente);

    return true;

}

/*
=========================================
        CLIENTE POR ID
=========================================
*/

function obtenerCliente(id){

    return db.clientes.find(

        cliente =>
            String(cliente.id) === String(id)

    );

}

/*
=========================================
        ELIMINAR CLIENTE
=========================================
*/

function eliminarClienteDB(id){

    db.clientes = db.clientes.filter(

        cliente =>
            String(cliente.id) !== String(id)

    );

}

/*
=========================================
        REGISTRAR VENTA
=========================================
*/

function agregarVentaDB(venta){

    if(!venta){

        return false;

    }

    db.ventas.push(venta);

    return true;

}

/*
=========================================
        CUENTAS POR COBRAR
=========================================
*/

function obtenerCuentasPorCobrar(){

    return db.ventas.filter(venta => {

        return Number(venta.saldoPendiente) > 0 &&
               venta.estadoPago === "Pendiente";

    });

}

/*
=========================================
        REGISTRAR PAGO
=========================================
*/

function registrarPagoVenta(idVenta, monto){

    const venta = db.ventas.find(

        venta =>
            String(venta.id) === String(idVenta)

    );

    if(!venta){

        return false;

    }

    monto = Number(monto) || 0;

    if(monto <= 0){

        return false;

    }

    const saldoActual =
        Number(venta.saldoPendiente) || 0;

    if(monto > saldoActual){

        monto = saldoActual;

    }

    venta.abono =
        (Number(venta.abono) || 0) + monto;

    venta.saldoPendiente =
        saldoActual - monto;

    if(venta.saldoPendiente <= 0){

        venta.saldoPendiente = 0;

        venta.estadoPago = "Pagado";

    }

    /*
    Guarda los cambios utilizando la función
    existente del sistema si está disponible.
    */
    if(typeof guardarCambios === "function"){

        guardarCambios();

    }

    return true;

}

/*
=========================================
        PRODUCTOS ACTIVOS
=========================================
*/

function productosActivos(){

    return db.productos.filter(

        producto =>
            producto.activo === true

    );

}

/*
=========================================
        TOTAL DE STOCK
=========================================
*/

function totalStock(){

    return db.productos.reduce(

        (total, producto) => {

            return total +
                (Number(producto.cantidad) || 0);

        },

        0

    );

}

/*
=========================================
        TOTAL DE GANANCIAS
=========================================
*/

function totalGanancias(){

    return db.ventas.reduce(

        (total, venta) => {

            return total +
                (Number(venta.ganancia) || 0);

        },

        0

    );

}

/*
=========================================
        MODELO DE ACTIVIDAD
=========================================
*/

function crearActividad(){

    const ahora = new Date();

    return {

        id: generarID(),

        fecha: ahora.toLocaleDateString(),

        hora: ahora.toLocaleTimeString(),

        fechaCompleta: ahora.getTime(),

        tipo: "",

        descripcion: ""

    };

}

/*
=========================================
        REGISTRAR ACTIVIDAD
=========================================
*/

async function registrarActividad(
    tipo,
    descripcion,
    relaciones = {}
){

    if(!db.actividad){

        db.actividad = [];

    }

    const actividad = crearActividad();

    actividad.tipo =
        tipo || "";

    actividad.descripcion =
        descripcion || "";

    actividad.cliente_id =
        relaciones.cliente_id ?? null;

    actividad.venta_id =
        relaciones.venta_id ?? null;

    actividad.producto_id =
        relaciones.producto_id ?? null;

    actividad.imagen_id =
        relaciones.imagen_id ?? null;

    actividad.pago_id =
        relaciones.pago_id ?? null;

    /* Mantiene la actividad disponible inmediatamente */
    db.actividad.unshift(actividad);

    /*
    =========================================
        GUARDAR ACTIVIDAD EN MYSQL
    =========================================
    */

    try{

        const respuesta =
            await registrarActividadAPI(
                actividad
            );

        if(
            !respuesta ||
            !respuesta.ok
        ){

            throw new Error(
                respuesta?.mensaje ||
                "No se pudo guardar la actividad."
            );

        }

        console.log(
            "Actividad guardada en MySQL:",
            respuesta
        );

    }catch(error){

        console.error(
            "Error guardando actividad en MySQL:",
            error
        );

    }

    /*
    =========================================
        ACTUALIZAR HISTORIAL
    =========================================
    */

    mostrarActividadReciente();

}

/*
=========================================
    SINCRONIZAR PRODUCTOS CON MYSQL
=========================================
*/
/*
Los productos ya fueron cargados desde MySQL
por cargarBaseDatos().

Esta función únicamente actualiza las partes
de la interfaz que dependen de db.productos.
*/
async function cargarProductosDesdeBackend(){

    try{

        const respuesta = await listarProductos();

        if(!respuesta || !respuesta.ok){

            console.error(
                "No se pudieron cargar los productos:",
                respuesta?.mensaje ||
                "Respuesta inválida del servidor."
            );

            return false;

        }

        const productosBackend =
            Array.isArray(respuesta.datos)
                ? respuesta.datos
                : [];

        db.productos = productosBackend.map(producto => {

            const idNumerico =
                Number(producto.id);

            return {

                id: Number.isNaN(idNumerico)
                    ? producto.id
                    : idNumerico,

                codigo:
                    producto.codigo || "",

                nombre:
                    producto.nombre || "",

                marca:
                    producto.marca || "",

                categoria:
                    producto.categoria || "",

                descripcion:
                    producto.descripcion || "",

                especificaciones:
                    producto.especificaciones || "",

                imagen:
                    producto.imagen || "",

                cantidad:
                    Number(producto.cantidad) || 0,

                stockMinimo:
                    Number(
                        producto.stockMinimo ??
                        producto.stock_minimo
                    ) || 5,

                costo:
                    Number(producto.costo) || 0,

                precio:
                    Number(producto.precio) || 0,

                ganancia:
                    Number(producto.ganancia) || 0,

                vendidos:
                    Number(producto.vendidos) || 0,

                fechaCreacion:
                    producto.fechaCreacion ??
                    producto.fecha_creacion ??
                    "",

                fechaActualizacion:
                    producto.fechaActualizacion ??
                    producto.fecha_actualizacion ??
                    "",

                ultimaVenta:
                    producto.ultimaVenta ??
                    producto.ultima_venta ??
                    "",

                activo:
                    Number(producto.activo) === 1

            };

        });

        console.log(
            "Productos sincronizados con MySQL:",
            db.productos
        );

        actualizarInventario();

        if(typeof mostrarProductosVenta === "function"){
            mostrarProductosVenta();
        }

        if(typeof actualizarDashboard === "function"){
            actualizarDashboard();
        }

        return true;

    }catch(error){

        console.error(
            "Error sincronizando productos con MySQL:",
            error
        );

        return false;

    }

}
/*
=========================================
    SINCRONIZAR CLIENTES CON MYSQL
=========================================
*/

async function cargarClientesDesdeBackend(){

    try{

        const respuesta = await listarClientes();

        if(!respuesta || !respuesta.ok){

            console.error(
                "No se pudieron cargar los clientes:",
                respuesta?.mensaje ||
                "Respuesta inválida del servidor."
            );

            return false;

        }

        const clientesBackend =
            Array.isArray(respuesta.datos)
                ? respuesta.datos
                : [];

        db.clientes = clientesBackend.map(cliente => {

            const idNumerico = Number(cliente.id);

            return {

                id: Number.isNaN(idNumerico)
                    ? cliente.id
                    : idNumerico,

                nombre:
                    cliente.nombre || "",

                apellido:
                    cliente.apellido || "",

                telefono:
                    cliente.telefono || "",

                correo:
                    cliente.correo || "",

                direccion:
                    cliente.direccion || "",

                fechaRegistro:
                    cliente.fecha_creacion || "",

                activo:
                    Number(cliente.activo) === 1

            };

        });

        console.log(
            "Clientes cargados desde MySQL:",
            db.clientes
        );
        
        if(typeof cargarClientesVenta === "function"){
        
            cargarClientesVenta();
        
        }
        
        if(typeof mostrarClientes === "function"){
        
            mostrarClientes();
        
        }
        
        return true;

    }catch(error){

        console.error(
            "Error cargando clientes desde MySQL:",
            error
        );

        return false;

    }

}
