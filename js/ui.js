/*
=========================================
            UI.JS
    Manejo de la interfaz
=========================================
*/

let productoEditando = null;

let filtroRapido = "todos";

/*
=========================================
        MODAL PRODUCTO
=========================================
*/

async function abrirModalProducto(){

    await cargarMarcas();
    await cargarCategorias();

    document
        .getElementById("modal")
        .classList
        .remove("oculto");

}

function cerrarModalProducto(){

    document
        .getElementById("modal")
        .classList
        .add("oculto");

}

async function nuevoProducto(){

    productoEditando = null;

    limpiarFormularioProducto();

    actualizarCodigoProducto();

    await abrirModalProducto();

}

/*
=========================================
        FILTROS RÁPIDOS
=========================================
*/

function iniciarFiltrosRapidos(){

    document
        .getElementById("btnTodos")
        .addEventListener("click",()=>{

            filtroRapido="todos";

            actualizarInventario();

        });

    document
        .getElementById("btnStockBajo")
        .addEventListener("click",()=>{

            filtroRapido="stock";

            actualizarInventario();

        });

    document
        .getElementById("btnAgotados")
        .addEventListener("click",()=>{

            filtroRapido="agotados";

            actualizarInventario();

        });

    document
        .getElementById("btnActivos")
        .addEventListener("click",()=>{

            filtroRapido="activos";

            actualizarInventario();

        });

}

/*
=========================================
        CAMBIO DE PÁGINAS
=========================================
*/

function cambiarPagina(nombrePagina){

    document
        .querySelectorAll(".page")
        .forEach(pagina=>{

            pagina.classList.remove("activa");

        });

    document
        .getElementById(nombrePagina)
        .classList
        .add("activa");

    document
        .querySelectorAll(".menu-btn")
        .forEach(boton=>{

            boton.classList.remove("activo");

        });

    document
        .querySelector(`[data-page="${nombrePagina}"]`)
        .classList
        .add("activo");

}

/*
=========================================
        MENÚ LATERAL
=========================================
*/

function iniciarMenu(){

    document
        .querySelectorAll(".menu-btn")
        .forEach(boton=>{

            boton.addEventListener("click",()=>{

                cambiarPagina(

                    boton.dataset.page

                );

            });

        });

}

/*
=========================================
        FACTURA
=========================================
*/

function abrirFactura(html){

    const contenedor=document.getElementById(
        "contenidoFactura"
    );

    if(!contenedor){

        return;

    }

    contenedor.innerHTML=`

        <div class="facturaContenido">

            ${html}

        </div>

        <div class="facturaBotones">

            <button
                class="btnImprimirFactura"
                onclick="imprimirFactura()">

                🖨 Imprimir

            </button>

            <button
                class="btnCerrarFactura"
                onclick="cerrarFactura()">

                Cerrar

            </button>

        </div>

    `;

    document
        .getElementById("modalFactura")
        .classList
        .remove("oculto");

}

function cerrarFactura(){

    document
        .getElementById("modalFactura")
        .classList
        .add("oculto");

}

function imprimirFactura(){

    const contenido=document.getElementById(
        "contenidoFactura"
    );

    if(!contenido){

        return;

    }

    const factura=
        contenido.querySelector(".facturaContenido");

    if(!factura){

        return;

    }

    const ventana=window.open(
        "",
        "_blank",
        "width=800,height=900,scrollbars=yesd"
    );

    if(!ventana){

        mostrarMensaje(
            "El navegador bloqueó la ventana de impresión."
        );

        return;

    }

    ventana.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>Factura - CosmetiStock</title>

            <meta charset="UTF-8">

            <style>

                body{

                    font-family:Arial,sans-serif;

                    padding:40px;

                    color:#333;

                    max-width:800px;

                    margin:auto;

                }

                h2{

                    color:#284B63;

                    margin-bottom:5px;

                }

                h3{

                    color:#284B63;

                }

                hr{

                    border:none;

                    border-top:1px solid #ddd;

                    margin:18px 0;

                }

                p{

                    margin:7px 0;

                }

                .facturaTotal{

                    text-align:right;

                    margin-top:25px;

                }

                .facturaPago{

                    margin-top:20px;

                }

                .facturaGracias{

                    text-align:center;

                    margin-top:35px;

                }

            </style>

        </head>

        <body>

            ${factura.innerHTML}

        </body>

        </html>

    `);

    ventana.document.close();

    ventana.focus();

    ventana.print();

}
/*
=========================================
    LIMPIAR FORMULARIO
=========================================
*/

function limpiarFormularioProducto(){

    document.getElementById("codigo").value="";

    document.getElementById("nombre").value="";

    document.getElementById("marca").value="";

    document.getElementById("categoria").selectedIndex=0;

    document.getElementById("descripcion").value="";

    document.getElementById("especificaciones").value="";

    document.getElementById("cantidad").value="";

    document.getElementById("stockMinimo").value=5;

    document.getElementById("costo").value="";

    document.getElementById("precio").value="";

    document.getElementById("ganancia").value="";

    document.getElementById("imagen").value="";

    const preview = document.getElementById("previewImagen");

    preview.src="";

    preview.style.display="none";

}

/*
=========================================
    CARGAR FORMULARIO
=========================================
*/

function cargarFormulario(producto){

    productoEditando = producto;

    document.getElementById("codigo").value = producto.codigo;

    document.getElementById("nombre").value = producto.nombre;

    document.getElementById("marca").value = producto.marca || "";

    document.getElementById("categoria").value = producto.categoria;

    document.getElementById("descripcion").value = producto.descripcion;

    document.getElementById("especificaciones").value = producto.especificaciones;

    document.getElementById("cantidad").value = producto.cantidad;

    document.getElementById("stockMinimo").value = producto.stockMinimo;

    document.getElementById("costo").value = producto.costo;

    document.getElementById("precio").value = producto.precio;

    document.getElementById("ganancia").value = producto.ganancia;

    const preview = document.getElementById("previewImagen");

    if(producto.imagen){

        preview.src = producto.imagen;

        preview.style.display = "block";

    }

    else{

        preview.src = "";

        preview.style.display = "none";

    }

    document.getElementById("imagen").value = "";

    document
        .getElementById("modal")
        .classList
        .remove("oculto");

}

/*
=========================================
        MENSAJES
=========================================
*/

function mostrarMensaje(texto){

    alert(texto);

}

/*
=========================================
        CONFIRMACIÓN
=========================================
*/

function confirmar(texto){

    return confirm(texto);

}
/*
=========================================
        MODAL CLIENTE
=========================================
*/

function abrirModalCliente(){

    clienteEditando = null;

    limpiarFormularioCliente();

    document
        .getElementById("modalCliente")
        .classList
        .remove("oculto");

}

function cerrarModalCliente(){

    document
        .getElementById("modalCliente")
        .classList
        .add("oculto");

}

function limpiarFormularioCliente(){

    document.getElementById("clienteNombre").value = "";
    document.getElementById("clienteApellido").value = "";
    document.getElementById("clienteTelefono").value = "";
    document.getElementById("clienteCorreo").value = "";
    document.getElementById("clienteDireccion").value = "";

}

function cargarFormularioCliente(cliente){

    clienteEditando = cliente.id;

    document.getElementById("clienteNombre").value = cliente.nombre;
    document.getElementById("clienteApellido").value = cliente.apellido;
    document.getElementById("clienteTelefono").value = cliente.telefono;
    document.getElementById("clienteCorreo").value = cliente.correo;
    document.getElementById("clienteDireccion").value = cliente.direccion;

    document
        .getElementById("modalCliente")
        .classList
        .remove("oculto");

}