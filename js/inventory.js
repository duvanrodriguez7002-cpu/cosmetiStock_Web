/* Carga los productos desde db y actualiza visualmente el inventario */
function actualizarInventario(){

    const contenedor =
        document.getElementById("listaProductos");

    if(!contenedor) return;

    try {

        /* Los productos ya fueron cargados desde MySQL */
        let productos = Array.isArray(db.productos)
            ? [...db.productos]
            : [];

        /* Buscador */
        const texto =
            document
                .getElementById("buscar")
                ?.value
                .toLowerCase() || "";

        if(texto !== ""){

            productos = productos.filter(producto =>

                (producto.nombre || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                (producto.codigo || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                (producto.marca || "")
                    .toLowerCase()
                    .includes(texto)

            );

        }

        /* Filtro de categoría */
        const categoria =
            document
                .getElementById("filtroCategoria")
                ?.value || "";

        if(categoria !== ""){

            productos = productos.filter(producto =>
                producto.categoria === categoria
            );

        }

        /* Filtro rápido */
        switch(filtroRapido){

            case "stock":

                productos = productos.filter(producto =>
                    Number(producto.cantidad) <=
                    Number(producto.stockMinimo)
                );

            break;

            case "agotados":

                productos = productos.filter(producto =>
                    Number(producto.cantidad) <= 0
                );

            break;

            case "activos":

                productos = productos.filter(producto =>
                    producto.activo
                );

            break;

        }

        /* Ordenar productos */
        const orden =
            document
                .getElementById("ordenProductos")
                ?.value || "az";

        switch(orden){

            case "az":

                productos.sort((a,b) =>
                    (a.nombre || "").localeCompare(
                        b.nombre || ""
                    )
                );

            break;

            case "za":

                productos.sort((a,b) =>
                    (b.nombre || "").localeCompare(
                        a.nombre || ""
                    )
                );

            break;

            case "stockMayor":

                productos.sort((a,b) =>
                    b.cantidad - a.cantidad
                );

            break;

            case "stockMenor":

                productos.sort((a,b) =>
                    a.cantidad - b.cantidad
                );

            break;

            case "precioMayor":

                productos.sort((a,b) =>
                    b.precio - a.precio
                );

            break;

            case "precioMenor":

                productos.sort((a,b) =>
                    a.precio - b.precio
                );

            break;

            case "gananciaMayor":

                productos.sort((a,b) =>
                    b.ganancia - a.ganancia
                );

            break;

            case "gananciaMenor":

                productos.sort((a,b) =>
                    a.ganancia - b.ganancia
                );

            break;

            case "vendidos":

                productos.sort((a,b) =>
                    b.vendidos - a.vendidos
                );

            break;

        }

        /* Sin resultados */
        if(productos.length === 0){

            contenedor.innerHTML = `
                <div class="card">
                    <h3>No se encontraron productos.</h3>
                    <p>Cambia los filtros o registra un nuevo producto.</p>
                </div>
            `;

            actualizarResumenInventario();

            return;

        }

        /* Mostrar productos */
        contenedor.innerHTML = "";

        productos.forEach(producto => {

            contenedor.appendChild(
                crearTarjetaProducto(producto)
            );

        });

        actualizarResumenInventario();
        actualizarCategorias();

    } catch(error) {

        console.error(
            "Error mostrando el inventario:",
            error
        );

        contenedor.innerHTML = `
            <div class="card">
                <h3>Error al cargar el inventario</h3>
                <p>No fue posible mostrar los productos.</p>
            </div>
        `;

    }

}

/* Actualiza visualmente el inventario cuando cambia el buscador */
function buscarProductos(){

    actualizarInventario();

}

/* Crea visualmente una tarjeta de producto */
function crearTarjetaProducto(producto){

    const tarjeta = document.createElement("div");

    tarjeta.className = "producto";

    const cantidad = Number(producto.cantidad) || 0;
    const stockMinimo = Number(
        producto.stockMinimo ??
        producto.stock_minimo ??
        5
    );

    let colorStock = "stock-normal";
    let textoStock = "Disponible";

    if(cantidad <= stockMinimo){

        colorStock = "stock-medio";
        textoStock = "Stock Bajo";

    }

    if(cantidad <= 0){

        colorStock = "stock-bajo";
        textoStock = "Agotado";

    }

    let porcentajeStock = Math.min(
        (cantidad / (stockMinimo * 2)) * 100,
        100
    );

    if(cantidad <= 0){

        porcentajeStock = 0;

    }

    const imagenValida =
    typeof producto.imagen === "string" &&
    producto.imagen.trim() !== "";

    const imagen = imagenValida
        ?
        `
        <div class="producto-imagen">
            <img
                src="${producto.imagen}"
                alt="${producto.nombre || "Producto"}"
                loading="lazy"
            >
        </div>
        `
        :
        `
        <div class="producto-imagen">
            <div class="sin-imagen">
                📦
            </div>
        </div>
        `;

    tarjeta.innerHTML = `

        ${imagen}

        <div class="producto-body">

            <div class="producto-header">

                    <div>
                
                        <h3>${producto.nombre || "-"}</h3>
                
                        <small class="codigo">
                            Código: ${producto.codigo || "-"}
                        </small>
                
                        <small class="codigo">
                            Marca: ${producto.marca || "-"}
                        </small>
                
                        <div class="badges">
                
                            <span class="badge badge-categoria">
                                ${producto.categoria || "-"}
                            </span>
                
                        </div>
                
                    </div>
                
                </div>

            <div class="stock">

                <div class="stock-info">

                    <span>
                        Stock: ${cantidad}
                    </span>

                    <span class="estado ${colorStock}">
                        ${textoStock}
                    </span>

                </div>

                <div class="stock-bar">

                    <div
                        class="stock-fill ${colorStock}"
                        style="width:${porcentajeStock}%">
                    </div>

                </div>

            </div>

            <div class="precios">

                <div class="precio-box">

                    <small>Costo de Producción</small>

                    <strong>
                        ${formatearDinero(producto.costo)}
                    </strong>

                </div>

                <div class="precio-box">

                    <small>Venta a público</small>

                    <strong>
                        ${formatearDinero(producto.precio)}
                    </strong>

                </div>

                <div class="precio-box">

                    <small>Valor del Inventario</small>

                    <strong>
                        ${formatearDinero(
                            Number(producto.costo) * cantidad
                        )}
                    </strong>

                </div>

                <div class="precio-box">

                    <small>Ganancia por Unidad</small>

                    <strong>
                        ${formatearDinero(producto.ganancia)}
                    </strong>

                </div>

                <div class="precio-box precio-box-grande">

                    <small>Ganancia Total</small>

                    <strong>
                        ${formatearDinero(
                            Number(producto.ganancia) * cantidad
                        )}
                    </strong>

                </div>

            </div>

            <div class="producto-info">

                <p>
                    <b>Vendidos:</b>
                    ${producto.vendidos || 0}
                </p>

                <p>
                    <b>Descripción:</b>
                    ${producto.descripcion || "-"}
                </p>

                <p>
                    <b>Especificaciones:</b>
                    ${producto.especificaciones || "-"}
                </p>

                <p>
                    <b>Stock mínimo:</b>
                    ${stockMinimo}
                </p>

                <p>
                    <b>Creado:</b>
                    ${producto.fecha_creacion || "-"}
                </p>

            </div>

            <div class="producto-botones">

                <button
                    class="btn-editar"
                    onclick="abrirEditarProducto(${producto.id})">

                    ✏ Editar

                </button>

                <button
                    class="btn-eliminar"
                    onclick="eliminarProducto(${producto.id})">

                    🗑️ Eliminar

                </button>

            </div>

        </div>

    `;

    return tarjeta;

}

/* Obtiene los datos introducidos en el formulario de productos */
function obtenerDatosFormulario(){

    const marcaSelect =
        document.getElementById("marca");

    const categoriaSelect =
        document.getElementById("categoria");

    const nuevaMarcaInput =
        document.getElementById("nuevaMarca");

    const nuevaCategoriaInput =
        document.getElementById("nuevaCategoria");

    const nuevaMarca =
        nuevaMarcaInput?.value.trim() || "";

    const nuevaCategoria =
        nuevaCategoriaInput?.value.trim() || "";

    const datos = {

        codigo:
            document.getElementById("codigo").value.trim(),

        nombre:
            document.getElementById("nombre").value.trim(),

        marca_id:
            marcaSelect.value === "otro"
                ? null
                : Number(marcaSelect.value) || null,

        nuevaMarca:
            marcaSelect.value === "otro"
                ? nuevaMarca
                : "",

        categoria_id:
            categoriaSelect.value === "otro"
                ? null
                : Number(categoriaSelect.value) || null,

        nuevaCategoria:
            categoriaSelect.value === "otro"
                ? nuevaCategoria
                : "",

        descripcion:
            document.getElementById("descripcion").value.trim(),

        especificaciones:
            document.getElementById("especificaciones").value.trim(),

        cantidad:
            Number(document.getElementById("cantidad").value) || 0,

        stockMinimo:
            Number(document.getElementById("stockMinimo").value) || 0,

        costo:
            obtenerNumero(
                document.getElementById("costo")
            ),

        precio:
            obtenerNumero(
                document.getElementById("precio")
            ),

        imagen:
            document.getElementById("previewImagen")?.src || ""
    };

    return datos;
}

/* Carga las marcas existentes desde MySQL */
async function cargarMarcas(){

    const select =
        document.getElementById("marca");

    if(!select) return;

    try {

        const respuesta = await listarMarcas();

        if(!respuesta || !respuesta.ok){

            throw new Error(
                respuesta?.mensaje ||
                "No se pudieron cargar las marcas."
            );

        }

        select.innerHTML = `
            <option value="">
                Seleccione una marca
            </option>
        `;

        (respuesta.datos || []).forEach(marca => {

            const option =
                document.createElement("option");

            option.value =
                marca.id;

            option.textContent =
                marca.nombre;

            select.appendChild(option);

        });

        const otro =
            document.createElement("option");

        otro.value = "otro";
        otro.textContent = "Otro";

        select.appendChild(otro);

    } catch(error) {

        console.error(
            "Error cargando marcas:",
            error
        );

    }
}


/* Carga las categorías existentes desde MySQL */
async function cargarCategorias(){

    const select =
        document.getElementById("categoria");

    if(!select) return;

    try {

        const respuesta =
            await listarCategorias();

        if(!respuesta || !respuesta.ok){

            throw new Error(
                respuesta?.mensaje ||
                "No se pudieron cargar las categorías."
            );

        }

        select.innerHTML = `
            <option value="">
                Seleccione una categoría
            </option>
        `;

        (respuesta.datos || []).forEach(categoria => {

            const option =
                document.createElement("option");

            option.value =
                categoria.id;

            option.textContent =
                categoria.nombre;

            select.appendChild(option);

        });

        const otro =
            document.createElement("option");

        otro.value = "otro";
        otro.textContent = "Otro";

        select.appendChild(otro);

    } catch(error) {

        console.error(
            "Error cargando categorías:",
            error
        );

    }
}

/* Muestra u oculta el campo para una nueva marca */
function controlarNuevaMarca(){

    const select =
        document.getElementById("marca");

    const contenedor =
        document.getElementById("nuevaMarcaContenedor");

    const input =
        document.getElementById("nuevaMarca");

    if(!select || !contenedor) return;

    if(select.value === "otro"){

        contenedor.style.display = "block";

        input?.focus();

    }else{

        contenedor.style.display = "none";

        if(input){
            input.value = "";
        }

    }

}


/* Muestra u oculta el campo para una nueva categoría */
function controlarNuevaCategoria(){

    const select =
        document.getElementById("categoria");

    const contenedor =
        document.getElementById("nuevaCategoriaContenedor");

    const input =
        document.getElementById("nuevaCategoria");

    if(!select || !contenedor) return;

    if(select.value === "otro"){

        contenedor.style.display = "block";

        input?.focus();

    }else{

        contenedor.style.display = "none";

        if(input){
            input.value = "";
        }

    }

}

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("marca")
        ?.addEventListener("change", controlarNuevaMarca);

    document
        .getElementById("categoria")
        ?.addEventListener("change", controlarNuevaCategoria);

    cargarMarcas();
    cargarCategorias();

});

/* Guarda un producto nuevo o actualiza uno existente en MySQL */
async function guardarProducto(){

    const datos =
        obtenerDatosFormulario();

        console.log("ESPECIFICACIONES ANTES DE ENVIAR:", datos.especificaciones);
        console.log("TIPO:", typeof datos.especificaciones);

    if(datos.nombre.trim() === ""){

        mostrarMensaje(
            "Ingrese el nombre del producto."
        );

        return;

    }

    if(
        !datos.marca_id &&
        datos.nuevaMarca === ""
    ){

        mostrarMensaje(
            "Seleccione una marca o registre una nueva."
        );

        return;

    }

    if(
        !datos.categoria_id &&
        datos.nuevaCategoria === ""
    ){

        mostrarMensaje(
            "Seleccione una categoría o registre una nueva."
        );

        return;

    }

    if(datos.cantidad < 0){

        mostrarMensaje(
            "Cantidad inválida."
        );

        return;

    }

    if(datos.stockMinimo < 0){

        mostrarMensaje(
            "Stock mínimo inválido."
        );

        return;

    }

    if(datos.costo < 0){

        mostrarMensaje(
            "Costo inválido."
        );

        return;

    }

    if(datos.precio < 0){

        mostrarMensaje(
            "Precio inválido."
        );

        return;

    }

    try {

        /* Crear producto */
        if(!productoEditando){

            const respuesta =
                await crearProducto({

                    nombre:
                        datos.nombre,

                    marca_id:
                        datos.marca_id,

                    nuevaMarca:
                        datos.nuevaMarca,

                    categoria_id:
                        datos.categoria_id,

                    nuevaCategoria:
                        datos.nuevaCategoria,

                    descripcion:
                        datos.descripcion,

                    especificaciones:
                        datos.especificaciones,

                    precio:
                        datos.precio,

                    costo:
                        datos.costo,

                    cantidad:
                        datos.cantidad,

                    stockMinimo:
                        datos.stockMinimo,

                    imagen:
                        datos.imagen

                });

            console.log(
                "Producto creado:",
                respuesta
            );

            registrarActividad(
                "➕ Producto",
                `Se agregó "${datos.nombre}"`,
                {
                    producto_id: respuesta.datos?.id || null
                }
            );

            mostrarMensaje(
                `Producto registrado correctamente. Código: ${respuesta.datos?.codigo || ""}`
            );

        }

        /* Editar producto */
        else {

            const respuesta =
                await editarProducto({

                    id:
                        productoEditando.id,

                    codigo:
                        datos.codigo,

                    nombre:
                        datos.nombre,

                    marca_id:
                        datos.marca_id,

                    nuevaMarca:
                        datos.nuevaMarca,

                    categoria_id:
                        datos.categoria_id,

                    nuevaCategoria:
                        datos.nuevaCategoria,

                    descripcion:
                        datos.descripcion,

                    especificaciones:
                        datos.especificaciones,

                    precio:
                        datos.precio,

                    costo:
                        datos.costo,

                    cantidad:
                        datos.cantidad,

                    stockMinimo:
                        datos.stockMinimo,

                    imagen:
                        datos.imagen

                });

            console.log(
                "Producto actualizado:",
                respuesta
            );

            registrarActividad(
                "✏ Producto",
                `Se editó "${datos.nombre}"`,
                {
                    producto_id: productoEditando.id || null
                }
            );

            mostrarMensaje(
                "Producto actualizado correctamente."
            );

        }

        await sincronizarDatos();

        productoEditando = null;

        cerrarModalProducto();

    } catch(error) {

        console.error(
            "Error guardando producto:",
            error
        );

        mostrarMensaje(
            error.message ||
            "No se pudo guardar el producto."
        );

    }

}

/* Abre el formulario y carga los datos de un producto desde MySQL */
async function abrirEditarProducto(id){

    try{

        const respuesta =
            await obtenerProducto(id);

        if(
            !respuesta ||
            !respuesta.ok
        ){

            mostrarMensaje(
                respuesta?.mensaje ||
                "No se encontró el producto."
            );

            return;

        }

        const producto =
            respuesta.datos;

        productoEditando =
            producto;

        abrirModalProducto();

        /* =========================================
                DATOS BÁSICOS
        ========================================= */

        document.getElementById("codigo").value =
            producto.codigo || "";

        document.getElementById("nombre").value =
            producto.nombre || "";

        document.getElementById("descripcion").value =
            producto.descripcion || "";

        document.getElementById("especificaciones").value =
            producto.especificaciones ||
            producto.especificaciones_tecnicas ||
            "";

        document.getElementById("cantidad").value =
            producto.cantidad ?? 0;

        document.getElementById("stockMinimo").value =
            producto.stock_minimo ??
            producto.stockMinimo ??
            5;

        document.getElementById("costo").value =
            producto.costo ?? 0;

        document.getElementById("precio").value =
            producto.precio ?? 0;

        document.getElementById("ganancia").value =
            producto.ganancia ?? 0;

        actualizarUtilidadAcumulada();

        /* =========================================
                CARGAR MARCAS Y CATEGORÍAS
        ========================================= */

        const marcaSelect =
            document.getElementById("marca");

        const categoriaSelect =
            document.getElementById("categoria");

        /*
        Esperamos a que las listas estén cargadas
        antes de seleccionar el valor del producto.
        */

        /* =========================================
             CARGAR MARCAS Y CATEGORÍAS
        ========================================= */

        await cargarMarcas();
        await cargarCategorias();

        if(typeof listarCategorias === "function"){

            const respuestaCategorias =
                await listarCategorias();

            if(
                respuestaCategorias &&
                respuestaCategorias.ok
            ){

                /*
                Si tu función ya carga el select,
                no hacemos nada aquí.
                */

            }

        }

        /* =========================================
                SELECCIONAR MARCA
        ========================================= */

        if(marcaSelect){

            const marcaId =
                producto.marca_id ??
                producto.marcaId ??
                null;

            if(marcaId){

                marcaSelect.value =
                    String(marcaId);

            }

        }

        /* =========================================
                SELECCIONAR CATEGORÍA
        ========================================= */

        if(categoriaSelect){

            const categoriaId =
                producto.categoria_id ??
                producto.categoriaId ??
                null;

            if(categoriaId){

                categoriaSelect.value =
                    String(categoriaId);

            }

        }

        /* =========================================
                IMAGEN
        ========================================= */

        const preview =
            document.getElementById("previewImagen");

        if(
            preview &&
            typeof producto.imagen === "string" &&
            producto.imagen.trim() !== ""
        ){

            preview.src =
                producto.imagen;

            preview.style.display =
                "block";

        }else if(preview){

            preview.src =
                "";

            preview.style.display =
                "none";

        }

    }catch(error){

        console.error(
            "Error obteniendo producto:",
            error
        );

        mostrarMensaje(
            "No se pudo cargar el producto."
        );

    }

}

/* Elimina físicamente o desactiva automáticamente un producto */
async function eliminarProducto(id){

    if(!confirm("¿Desea eliminar este producto?")){

        return;

    }

    const producto = db.productos.find(
        producto => Number(producto.id) === Number(id)
    );

    if(!producto){

        mostrarMensaje("Producto no encontrado.");

        return;

    }

    try {

        /* El backend decide si eliminar o desactivar */
        const respuesta = await eliminarProductoAPI(id);

        console.log(
            "Resultado de eliminación:",
            respuesta
        );

        const accion =
            respuesta.datos?.accion || "";

        /*
        =========================================
        PRODUCTO DESACTIVADO
        =========================================
        */

        if(accion === "desactivado"){

            await registrarActividad(
                "🗑 Producto desactivado",
                `El producto "${producto.nombre}" tenía ventas y fue desactivado.`,
                {
                    producto_id: producto.id || null
                }
            );

            mostrarMensaje(
                "El producto tenía ventas y fue desactivado."
            );

        }

        /*
        =========================================
        PRODUCTO ELIMINADO
        =========================================
        */

        else if(accion === "eliminado"){

            await registrarActividad(
                "🗑 Producto eliminado",
                `El producto "${producto.nombre}" fue eliminado permanentemente.`,
                {
                    producto_id: null
                }
            );

            mostrarMensaje(
                "Producto eliminado permanentemente."
            );

        }

        else{

            mostrarMensaje(
                respuesta.mensaje ||
                "Operación realizada correctamente."
            );

        }

        /* Sincronizar todos los datos */
        await sincronizarDatos();

    } catch(error) {

        console.error(
            "Error eliminando producto:",
            error
        );

        mostrarMensaje(
            error.message ||
            "No se pudo eliminar el producto."
        );

    }

}
/* Aumenta el stock directamente en MySQL */
async function aumentarStock(id, cantidad){

    try {

        const respuesta = await obtenerProducto(id);

        if(!respuesta.ok || !respuesta.datos){

            mostrarMensaje(
                "No se encontró el producto."
            );

            return;

        }

        const producto = respuesta.datos;

        const nuevoStock =
            Number(producto.cantidad) +
            Number(cantidad);

        await actualizarStock(
            id,
            nuevoStock
        );

        await sincronizarDatos();

        mostrarMensaje(
            "Stock actualizado correctamente."
        );

    } catch(error) {

        console.error(
            "Error aumentando stock:",
            error
        );

        mostrarMensaje(
            "No se pudo actualizar el stock."
        );

    }

}

/* Disminuye el stock verificando primero la cantidad disponible */
async function disminuirStock(id, cantidad){

    try {

        const respuesta = await obtenerProducto(id);

        if(!respuesta.ok || !respuesta.datos){

            mostrarMensaje(
                "No se encontró el producto."
            );

            return false;

        }

        const producto = respuesta.datos;

        const stockActual =
            Number(producto.cantidad) || 0;

        const cantidadReducir =
            Number(cantidad) || 0;

        if(stockActual < cantidadReducir){

            mostrarMensaje(
                "No hay suficiente stock."
            );

            return false;

        }

        const nuevoStock =
            stockActual - cantidadReducir;

        await actualizarStock(
            id,
            nuevoStock
        );

        await sincronizarDatos();

        return true;

    } catch(error) {

        console.error(
            "Error disminuyendo stock:",
            error
        );

        mostrarMensaje(
            "No se pudo actualizar el stock."
        );

        return false;

    }

}

/* Devuelve los productos que están en su stock mínimo o por debajo */
function productosStockBajo(){

    return (Array.isArray(db.productos)
        ? db.productos
        : []
    ).filter(producto =>

        Number(producto.cantidad) <=
        Number(producto.stockMinimo ?? producto.stock_minimo ?? 5)

    );

}

/* Devuelve los productos que tienen existencia disponible */
function productosDisponibles(){

    return (Array.isArray(db.productos)
        ? db.productos
        : []
    ).filter(producto =>

        Number(producto.cantidad) > 0

    );

}

/* Ordena visualmente los productos por nombre */
function ordenarProductosAZ(){

    return (Array.isArray(db.productos)
        ? [...db.productos]
        : []
    ).sort((a,b) =>

        (a.nombre || "").localeCompare(
            b.nombre || ""
        )

    );

}

/* Ordena visualmente los productos por cantidad disponible */
function ordenarProductosStock(){

    return (Array.isArray(db.productos)
        ? [...db.productos]
        : []
    ).sort((a,b) =>

        Number(b.cantidad) -
        Number(a.cantidad)

    );

}