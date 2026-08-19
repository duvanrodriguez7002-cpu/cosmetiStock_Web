/*
=========================================
            APP.JS
    Archivo principal de la aplicación
=========================================
*/

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

async function iniciarAplicacion(){

    await cargarBaseDatos();

    cargarModoOscuro();

    iniciarMenu();

    registrarEventos();

    const descuento = document.getElementById(
        "descuentoVenta"
    );

    if(descuento){

        descuento.addEventListener(
            "input",
            () => {

                formatearDineroInput(descuento);
                actualizarDescuento();

            }
        );

    }

    actualizarTodo();
}

function cargarModoOscuro(){

    const modoOscuro=localStorage.getItem(
        "CosmetiStockModoOscuro"
    );

    if(modoOscuro==="true"){

        document.body.classList.add(
            "modoOscuro"
        );

    }

    actualizarBotonModoOscuro();

}

/*======================================*
    REGISTRO DE EVENTOS
*======================================*/

function registrarEventos(){

    const buscar=document.getElementById("buscar");

    if(buscar){

        buscar.addEventListener(
            "input",
            buscarProductos
        );

    }

    const buscarVenta=document.getElementById("buscarVenta");

    if(buscarVenta){

        buscarVenta.addEventListener(
            "input",
            mostrarProductosVenta
        );

    }

    const metodoPago=document.getElementById("metodoPago");

    if(metodoPago){

        metodoPago.addEventListener(
            "change",
            actualizarMetodoPago
        );

    }

    /*======================================*
        CONFIGURACIÓN
    *======================================*/

    const exportar=document.getElementById("btnExportar");

    if(exportar){

        exportar.addEventListener(
            "click",
            exportarInventario
        );

    }

    const importar=document.getElementById("btnImportar");

    if(importar){

        importar.addEventListener(
            "click",
            ()=>{
                document
                    .getElementById("archivoJSON")
                    .click();
            }
        );

    }

    const archivo=document.getElementById("archivoJSON");

    if(archivo){

        archivo.addEventListener(
            "change",
            importarInventario
        );

    }

    const btnVaciar=document.getElementById("btnVaciar");

    if(btnVaciar){

        btnVaciar.addEventListener(
            "click",
            limpiarBaseDatos
        );
    }

    /*======================================*
        PRODUCTOS
    *======================================*/

    const btnNuevo=document.getElementById("btnNuevo");

    if(btnNuevo){

        btnNuevo.addEventListener(
            "click",
            nuevoProducto
        );

    }

    const guardar=document.getElementById("guardarProducto");

    if(guardar){

        guardar.addEventListener(
            "click",
            guardarProducto
        );

    }

    const cancelar=document.getElementById("cancelar");

    if(cancelar){

        cancelar.addEventListener(
            "click",
            cerrarModalProducto
        );

    }

    /*======================================*
        CLIENTES
    *======================================*/

    const buscarCliente=document.getElementById("buscarCliente");

    if(buscarCliente){

        buscarCliente.addEventListener(
            "input",
            mostrarClientes
        );

    }

    const guardarClienteBtn=
        document.getElementById("guardarCliente");

    if(guardarClienteBtn){

        guardarClienteBtn.addEventListener(
            "click",
            guardarCliente
        );

    }

    const cancelarClienteBtn=
        document.getElementById("cancelarCliente");

    if(cancelarClienteBtn){

        cancelarClienteBtn.addEventListener(
            "click",
            cerrarModalCliente
        );

    }

    /*======================================*
        VENTAS
    *======================================*/

    const confirmar=
        document.getElementById("confirmarVenta");

    if(confirmar){

        confirmar.addEventListener(
            "click",
            confirmarVenta
        );

    }

    /*======================================*
        COSTO Y PRECIO
    *======================================*/

    const costo = document.getElementById("costo");
    const precio = document.getElementById("precio");

    if(costo){

        costo.addEventListener("input", () => {

            formatearDineroInput(costo);
            actualizarUtilidad();

        });

    }

    if(precio){

        precio.addEventListener("input", () => {

            formatearDineroInput(precio);
            actualizarUtilidad();

        });

    }

    /*======================================*
        IMAGEN
    *======================================*/

    const imagen=document.getElementById("imagen");

    if(imagen){

        imagen.addEventListener(
            "change",
            mostrarVistaPrevia
        );

    }

    /*======================================*
        CATEGORÍA
    *======================================*/

    const categoria=document.getElementById("categoria");

    if(categoria){

        categoria.addEventListener(
            "change",
            actualizarCodigoProducto
        );

    }
    const btnInfo=document.getElementById("btnInfo");

    if(btnInfo){

        btnInfo.addEventListener(
            "click",
            mostrarInformacion
        );

    }

    const btnCerrarInfo=document.getElementById(
        "btnCerrarInfo"
    );

    if(btnCerrarInfo){

        btnCerrarInfo.addEventListener(
            "click",
            cerrarInformacion
        );

    }

    const btnModoOscuro=document.getElementById(
        "btnModoOscuro"
    );
    
    if(btnModoOscuro){
    
        btnModoOscuro.addEventListener(
            "click",
            alternarModoOscuro
        );
    
    }

    /*=====================================================
        MENÚ HAMBURGUESA RESPONSIVE
    =====================================================*/

    const btnMenu = document.getElementById("btnMenuHamburguesa");
    const sidebar = document.querySelector(".sidebar");
    const menuBotones = document.querySelectorAll(".menu-btn");

    if(btnMenu && sidebar){

        btnMenu.addEventListener("click", (e) => {

            e.stopPropagation();

            sidebar.classList.toggle("abierto");

            const abierto = sidebar.classList.contains("abierto");

            btnMenu.setAttribute("aria-expanded", abierto);
            btnMenu.textContent = abierto ? "✕" : "☰";

        });


        /* CERRAR AL SELECCIONAR UNA OPCIÓN */

        menuBotones.forEach((boton) => {

            boton.addEventListener("click", () => {

                if(window.innerWidth <= 1024){

                    sidebar.classList.remove("abierto");

                    btnMenu.setAttribute("aria-expanded", "false");

                    btnMenu.textContent = "☰";

                }

            });

        });


        /* CERRAR AL HACER CLICK FUERA */

        document.addEventListener("click", (e) => {

            if(window.innerWidth > 1024){
                return;
            }

            if(
                sidebar.classList.contains("abierto") &&
                !sidebar.contains(e.target) &&
                !btnMenu.contains(e.target)
            ){

                sidebar.classList.remove("abierto");

                btnMenu.setAttribute("aria-expanded", "false");

                btnMenu.textContent = "☰";

            }

        });


        /* CERRAR CON ESC */

        document.addEventListener("keydown", (e) => {

            if(e.key === "Escape"){

                sidebar.classList.remove("abierto");

                btnMenu.setAttribute("aria-expanded", "false");

                btnMenu.textContent = "☰";

            }

        });


        /* RESTABLECER AL VOLVER A PC */

        window.addEventListener("resize", () => {

            if(window.innerWidth > 1024){

                sidebar.classList.remove("abierto");

                btnMenu.setAttribute("aria-expanded", "false");

                btnMenu.textContent = "☰";

            }

        });

    }
}

/*======================================*
    INFORMACIÓN Y AYUDA
*======================================*/

function mostrarInformacion(){

    const panel=document.getElementById(
        "panelInformacion"
    );

    if(!panel){
        return;
    }

    panel.hidden=false;

}

function cerrarInformacion(){

    const panel=document.getElementById(
        "panelInformacion"
    );

    if(!panel){
        return;
    }

    panel.hidden=true;

}
/*======================================*
    MODO OSCURO
*======================================*/

function alternarModoOscuro(){

    document.body.classList.toggle(
        "modoOscuro"
    );

    const oscuro=document.body.classList.contains(
        "modoOscuro"
    );

    localStorage.setItem(
        "CosmetiStockModoOscuro",
        oscuro
    );

    actualizarBotonModoOscuro();

}

function actualizarBotonModoOscuro(){

    const boton=document.getElementById(
        "btnModoOscuro"
    );

    if(!boton){
        return;
    }

    const oscuro=document.body.classList.contains(
        "modoOscuro"
    );

    boton.textContent=oscuro
        ? "Modo Claro"
        : "Modo Oscuro";

}
/*
=========================================
            MENU LATERAL
=========================================
*/

function iniciarMenu(){

    const botones=document.querySelectorAll(".menu-btn");

    const paginas=document.querySelectorAll(".page");

    botones.forEach(boton=>{

        boton.addEventListener("click",()=>{

            botones.forEach(b=>b.classList.remove("activo"));

            paginas.forEach(p=>p.classList.remove("activa"));

            boton.classList.add("activo");

            const destino=boton.dataset.page;

            document
            .getElementById(destino)
            .classList
            .add("activa");

            if(window.innerWidth<=800){

                const sidebar=document.querySelector(".sidebar");
            
                if(sidebar){
            
                    sidebar.classList.remove("menuAbierto");
            
                }
            
            }

        });

    });

}

/*
=========================================
        ACTUALIZAR TODA LA APP
=========================================
*/

function actualizarTodo(){

    actualizarInventario();

    actualizarDashboard();

    actualizarEstadisticas();

    mostrarClientes();

    cargarClientesVenta();

    mostrarProductosVenta();

    mostrarHistorial();

    mostrarActividadReciente();

    actualizarUtilidadAcumulada();

    if(typeof mostrarAlertas === "function"){
        mostrarAlertas();
    }

}

/*
=========================================
    ACTUALIZAR DATOS DESDE MYSQL
=========================================
*/

async function actualizarDatos(){

    try{

        console.log("Actualizando datos desde MySQL...");

        await cargarBaseDatos();

        actualizarTodo();

        console.log("Datos actualizados correctamente.");

    }catch(error){

        console.error(
            "Error actualizando datos:",
            error
        );

    }

}

/*
=========================================
        FORMATO DINERO
=========================================
*/

function dinero(valor){

    return "$"+Number(valor).toLocaleString("es-CO");

}
/*
=========================================
    ACTUALIZAR ganancia
=========================================
*/

function actualizarUtilidad(){

    const costoInput = document.getElementById("costo");
    const precioInput = document.getElementById("precio");
    const gananciaInput = document.getElementById("ganancia");

    if(!costoInput || !precioInput || !gananciaInput){
        return;
    }

    const costo = obtenerNumero(costoInput);
    const precio = obtenerNumero(precioInput);

    const ganancia = precio - costo;

    gananciaInput.value =
        ganancia.toLocaleString("es-CO");
}
/*
=========================================
    ACTUALIZAR CODIGO PRODUCTO
=========================================
*/

function actualizarCodigoProducto(){

    if(productoEditando) return;

    const categoria=document.getElementById("categoria").value;

    document.getElementById("codigo").value=

    generarCodigoProducto(categoria);

}

/*
=========================================
        CAMBIAR PÁGINAS
=========================================
*/

function cambiarPagina(nombrePagina){

    document

        .querySelectorAll(".page")

        .forEach(pagina=>{

            pagina.classList.remove("activa");

        });

    document

        .querySelectorAll(".menu-btn")

        .forEach(boton=>{

            boton.classList.remove("activo");

        });

    document

        .getElementById(nombrePagina)

        .classList.add("activa");

    document

        .querySelector(

            `.menu-btn[data-page="${nombrePagina}"]`

        )

        .classList.add("activo");

}

// if ("serviceWorker" in navigator) {
//     navigator.serviceWorker.register("sw.js");
// }