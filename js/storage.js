/*
=========================================
            STORAGE.JS
    Persistencia de datos
=========================================
*/

const STORAGE_KEY = "CosmetiStockDB";

/*
=========================================
        GUARDAR BASE DE DATOS
=========================================
*/

function guardarBaseDatos(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );

}

/*
=========================================
        CARGAR BASE DE DATOS
=========================================
*/

async function cargarBaseDatos(){

    try{

        console.time("Carga completa de MySQL");

        const [
            respuestaProductos,
            respuestaClientes,
            respuestaVentas,
            respuestaActividades
        ] = await Promise.all([
            listarProductos(),
            listarClientes(),
            listarVentas(),
            listarActividades(12)
        ]);

        /* PRODUCTOS */

        if(
            respuestaProductos &&
            Array.isArray(respuestaProductos.datos)
        ){

            db.productos =
                respuestaProductos.datos;
                
                console.log(
                    "STOCK MÍNIMO RECIBIDO:",
                    db.productos.map(producto => ({
                        id: producto.id,
                        nombre: producto.nombre,
                        stockMinimo: producto.stockMinimo,
                        stock_minimo: producto.stock_minimo
                    }))
                );

        }else{

            db.productos = [];

        }

        /* CLIENTES */

        if(
            respuestaClientes &&
            Array.isArray(respuestaClientes.datos)
        ){

            db.clientes =
                respuestaClientes.datos;

        }else{

            db.clientes = [];

        }

        /* VENTAS */

        if(
            respuestaVentas &&
            Array.isArray(respuestaVentas.datos)
        ){

            db.ventas =
                respuestaVentas.datos.map(venta => {

                    const cliente =
                        db.clientes.find(
                            c =>
                                String(c.id) ===
                                String(venta.cliente_id)
                        );

                    return {

                        ...venta,

                        id:
                            venta.id,

                        cliente:
                            cliente || null,

                        metodoPago:
                            venta.metodoPago ||
                            venta.metodo_pago ||
                            "contado",

                        subtotal:
                            Number(venta.subtotal) || 0,

                        descuento:
                            Number(venta.descuento) || 0,

                        total:
                            Number(venta.total) || 0,

                        ganancia:
                            Number(venta.ganancia) || 0,

                        abono:
                            Number(venta.abono) || 0,

                        saldoPendiente:
                            Number(
                                venta.saldoPendiente
                            ) || 0,

                        estadoPago:
                            venta.estadoPago ||
                            (
                                Number(
                                    venta.saldoPendiente
                                ) > 0
                                    ? "Pendiente"
                                    : "Pagado"
                            ),

                        fechaCredito:
                            venta.fechaCredito ||
                            null,

                        productos:
                            Array.isArray(
                                venta.productos
                            )
                                ? venta.productos
                                : []

                    };

                });

        }else{

            db.ventas = [];

        }

        /* ACTIVIDADES */

        if(
            respuestaActividades &&
            Array.isArray(respuestaActividades.datos)
        ){

            db.actividad =
                respuestaActividades.datos;

        }else{

            db.actividad = [];

        }

        console.log(
            "Productos cargados desde MySQL:",
            db.productos
        );

        console.log(
            "Clientes cargados desde MySQL:",
            db.clientes
        );

        console.log(
            "Ventas cargadas desde MySQL:",
            db.ventas
        );

        console.log(
            "Actividades cargadas desde MySQL:",
            db.actividad
        );

        console.timeEnd("Carga completa de MySQL");

    }catch(error){

        console.error(
            "No se pudieron cargar los datos desde MySQL:",
            error
        );

        throw error;

    }

}

/*
=========================================
        SINCRONIZAR DATOS
=========================================
*/

async function sincronizarDatos(){

    try{

        await cargarBaseDatos();

        actualizarTodo();

    }catch(error){

        console.error(
            "Error sincronizando los datos:",
            error
        );

    }

}

/*
=========================================
        LIMPIAR BASE DE DATOS
=========================================
*/

function limpiarBaseDatos(){

    if(
        confirm(
            "¿Seguro que deseas limpiar toda la información?\n\n"+
            "Se eliminarán productos, clientes, ventas, imágenes y demás información de MySQL y LocalStorage.\n\n"+
            "Las tablas y la estructura de la base de datos NO serán eliminadas.\n\n"+
            "Esta acción no se puede deshacer."
        )
    ){

        fetch("/backend/productos.php",{
            method:"POST",
            headers:{
                "Content-Type":"application/x-www-form-urlencoded"
            },
            body:"accion=vaciar_base_datos"
        })
        .then(respuesta => respuesta.json())
        .then(resultado => {

            if(!resultado.ok){

                alert(
                    resultado.mensaje ||
                    "No se pudo limpiar la base de datos."
                );

                return;
            }

            /*
            =========================================
                    LIMPIAR LOCALSTORAGE
            =========================================
            */

            localStorage.removeItem(STORAGE_KEY);

            /*
            =========================================
                    REINICIAR BASE LOCAL
            =========================================
            */

            db = {

                productos:[],

                clientes:[],

                ventas:[],

                actividad:[]

            };

            /*
            =========================================
                    ACTUALIZAR INTERFAZ
            =========================================
            */

            actualizarTodo();

            alert(
                "Toda la información fue eliminada correctamente."
            );

        })
        .catch(error => {

            console.error(
                "Error al limpiar la base de datos:",
                error
            );

            alert(
                "No se pudo conectar con MySQL."
            );

        });

    }

}

/*
=========================================
        EXPORTAR JSON
=========================================
*/

function exportarInventario(){

    const contenido = JSON.stringify(
        db,
        null,
        4
    );

    const archivo = new Blob(
        [contenido],
        {
            type:"application/json"
        }
    );

    const url = URL.createObjectURL(
        archivo
    );

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download =
        "CosmetiStock_Backup.json";

    enlace.click();

    URL.revokeObjectURL(url);

    registrarActividad(
        "Exportación",
        "Se exportó el inventario"
    );

}

/*
=========================================
        IMPORTAR JSON
=========================================
*/

async function importarInventario(event){

    const archivo = event.target.files[0];

    if(!archivo){
        return;
    }

    try{

        const texto = await archivo.text();
        const datos = JSON.parse(texto);

        if(
            !datos ||
            !Array.isArray(datos.productos) ||
            !Array.isArray(datos.clientes) ||
            !Array.isArray(datos.ventas)
        ){

            throw new Error(
                "El archivo no tiene una estructura de inventario válida."
            );

        }

        const confirmar = confirm(
            "Se reemplazará la información actual del sistema con los datos del archivo.\n\n" +
            "Productos: " + datos.productos.length + "\n" +
            "Clientes: " + datos.clientes.length + "\n" +
            "Ventas: " + datos.ventas.length + "\n\n" +
            "¿Deseas continuar?"
        );

        if(!confirmar){

            event.target.value = "";
            return;

        }

        const respuesta = await fetch(
            "backend/productos.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    accion: "importar_inventario",

                    productos: datos.productos || [],

                    clientes: datos.clientes || [],

                    ventas: datos.ventas || [],

                    actividad: datos.actividad || []

                })
            }
        );

        const resultado = await respuesta.json();

        if(!respuesta.ok || !resultado.ok){

            throw new Error(
                resultado.mensaje ||
                "No se pudo importar el inventario."
            );

        }

        /*
        =========================================
            ACTUALIZAR INFORMACIÓN LOCAL
        =========================================
        */

        db = {

            productos: resultado.datos?.productos || [],

            clientes: resultado.datos?.clientes || [],

            ventas: resultado.datos?.ventas || [],

            actividad: resultado.datos?.actividad || []

        };

        /*
        =========================================
            ACTUALIZAR INTERFAZ
        =========================================
        */

        actualizarTodo();

        alert(
            "Inventario importado correctamente.\n\n" +
            "Productos: " + datos.productos.length + "\n" +
            "Clientes: " + datos.clientes.length + "\n" +
            "Ventas: " + datos.ventas.length
        );

    }
    catch(error){

        console.error(
            "Error importando inventario:",
            error
        );

        alert(
            "No se pudo importar el inventario.\n\n" +
            error.message
        );

    }
    finally{

        event.target.value = "";

    }

}

/*
=========================================
        GUARDADO AUTOMÁTICO
=========================================
*/

function guardarCambios(){

    guardarBaseDatos();

    actualizarTodo();

}