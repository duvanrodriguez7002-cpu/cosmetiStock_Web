/*
=========================================
            SALES.JS
=========================================
*/

let carrito=[];

/*======================================
        MÉTODO DE PAGO
======================================*/

function actualizarMetodoPago(){

    const metodo=document.getElementById("metodoPago").value;
    const contenedor=document.getElementById("camposPago");

    if(!contenedor){
        return;
    }

    if(metodo==="contado"){

        contenedor.innerHTML="";

        return;

    }

    if(metodo==="abono"){

        contenedor.innerHTML=`

            <label>Valor abonado</label>

            <input
                type="text"
                id="valorAbono"
                inputmode="numeric"
                min="0"
                placeholder="Ingrese el abono">

            <div class="saldoPendiente">

                Saldo:

                <strong id="saldoPendiente">

                    $0

                </strong>

            </div>

        `;

    }

    if(metodo==="credito"){

        contenedor.innerHTML=`

            <label>Cuota inicial</label>

            <input
                type="text"
                id="valorAbono"
                inputmode="numeric"
                min="0"
                placeholder="Opcional">

            <label>Fecha límite</label>

            <input
                type="date"
                id="fechaCredito">

            <div class="saldoPendiente">

                Saldo:

                <strong id="saldoPendiente">

                    $0

                </strong>

            </div>

        `;

    }

    const campoAbono=document.getElementById("valorAbono");

    if(campoAbono){

        campoAbono.addEventListener(
            "input",
            ()=>{
                formatearDineroInput(campoAbono);
                calcularSaldo();
            }
        );

    }

    calcularSaldo();

}
/*======================================
        SALDO
======================================*/

function calcularSaldo(){

    const saldo=document.getElementById("saldoPendiente");

    if(!saldo){
        return;
    }

    const campoAbono=document.getElementById("valorAbono");

    const abonado=obtenerNumero(campoAbono);

    const total=totalCarrito();

    const descuentoInput=document.getElementById(
        "descuentoVenta"
    );

    const descuento=obtenerNumero(
        descuentoInput
    );

    const totalFinal=Math.max(
        total-descuento,
        0
    );

    const saldoPendiente=Math.max(
        totalFinal-abonado,
        0
    );

    saldo.textContent=
        formatearDinero(
            saldoPendiente
        );

}

/*
=========================================
    MOSTRAR PRODUCTOS EN VENTAS
=========================================
*/

function mostrarProductosVenta(){

    const contenedor=document.getElementById("listaProductosVenta");

    if(!contenedor){

        return;

    }

    const texto=document.getElementById("buscarVenta")?.value.toLowerCase() || "";

    contenedor.innerHTML="";

    let productos=db.productos.filter(producto=>producto.activo);

    if(texto!==""){

        productos=productos.filter(producto=>

            producto.nombre.toLowerCase().includes(texto) ||

            producto.codigo.toLowerCase().includes(texto) ||

            producto.categoria.toLowerCase().includes(texto)

        );

    }

    if(productos.length===0){

        contenedor.innerHTML=`

            <p class="vacio">

                No se encontraron productos.

            </p>

        `;

        return;

    }

    productos.forEach(producto=>{

        contenedor.innerHTML+=`

        <div class="productoVenta">

            <div>

                <h4>${producto.nombre}</h4>

                <small>${producto.codigo}</small>

                <p>

                    Stock: <b>${producto.cantidad}</b>

                </p>

                <strong>

                    ${formatearDinero(producto.precio)}

                </strong>

            </div>

            <button

                onclick="agregarAlCarrito('${producto.id}')">

                Agregar

            </button>

        </div>

        `;

    });

}

/*
=========================================
    CARGAR CLIENTES
=========================================
*/

function cargarClientesVenta(){

    const select=document.getElementById("clienteVenta");

    if(!select){

        return;

    }

    select.innerHTML=`

        <option value="">

            Cliente ocasional

        </option>

    `;

    db.clientes.forEach(cliente=>{

        if(!cliente.activo){

            return;

        }

        select.innerHTML+=`

            <option value="${cliente.id}">

                ${cliente.nombre} ${cliente.apellido}

            </option>

        `;

    });

}

/*
=========================================
        AGREGAR AL CARRITO
=========================================
*/

function agregarAlCarrito(id){

    const producto=obtenerProductoLocal(id);

    if(!producto){
        mostrarMensaje("Producto no encontrado.");
        return;
    }

    if(!producto.activo){
        mostrarMensaje("El producto está inactivo.");
        return;
    }

    if(Number(producto.cantidad)<=0){
        mostrarMensaje("Producto agotado.");
        return;
    }

    const existente=carrito.find(
        item=>String(item.id)===String(id)
    );

    if(existente){

        if(existente.cantidad>=Number(producto.cantidad)){
            mostrarMensaje("No hay más stock.");
            return;
        }

        existente.cantidad++;

    }else{

        carrito.push({

            id:producto.id,

            nombre:producto.nombre,

            precio:Number(producto.precio)||0,

            costo:Number(producto.costo)||0,

            ganancia:Number(producto.ganancia)||0,

            cantidad:1

        });

    }

    actualizarCarrito();

}
/*
=========================================
        ACTUALIZAR CARRITO
=========================================
*/

function actualizarCarrito(){

    const contenedor=document.getElementById(
        "carrito"
    );

    if(!contenedor){
        return;
    }

    contenedor.innerHTML="";

    let total=0;

    carrito.forEach(item=>{

        const precio=Number(item.precio)||0;

        const cantidad=Number(item.cantidad)||0;

        const subtotal=precio*cantidad;

        total+=subtotal;

        const div=document.createElement("div");

        div.className="item-carrito";

        div.innerHTML=`

            <div class="item-info">

                <strong>${item.nombre || "Producto"}</strong>

                <small>

                    ${formatearDinero(precio)}

                    c/u

                </small>

            </div>

            <div>

                <button
                    type="button"
                    onclick="cambiarCantidad('${item.id}',-1)">
                    -
                </button>

                <strong style="margin:0 12px;">

                    ${cantidad}

                </strong>

                <button
                    type="button"
                    onclick="cambiarCantidad('${item.id}',1)">
                    +
                </button>

            </div>

            <div class="item-total">

                ${formatearDinero(subtotal)}

            </div>

        `;

        contenedor.appendChild(div);

    });

    const descuentoInput=document.getElementById(
        "descuentoVenta"
    );

    let descuento=0;

    if(descuentoInput){

        descuento=obtenerNumero(descuentoInput)||0;

    }

    if(descuento<0){
        descuento=0;
    }

    if(descuento>total){

        descuento=total;

        if(descuentoInput){
            descuentoInput.value=total;
        }

    }

    const totalFinal=total-descuento;

    const subtotal=document.getElementById(
        "subtotalVenta"
    );

    const totalVenta=document.getElementById(
        "totalVenta"
    );

    if(subtotal){

        subtotal.textContent=
            formatearDinero(total);

    }

    if(totalVenta){

        totalVenta.textContent=
            formatearDinero(totalFinal);

    }

    calcularSaldo();

}
/*
=========================================
        CALCULAR TOTAL CON DESCUENTO
=========================================
*/

function actualizarDescuento(){

    const descuentoInput=document.getElementById(
        "descuentoVenta"
    );

    if(!descuentoInput){
        return;
    }

    let descuento=obtenerNumero(descuentoInput)||0;

    const total=totalCarrito();

    if(descuento<0){
        descuento=0;
    }

    if(descuento>total){
        descuento=total;
        descuentoInput.value=total;
    }

    descuentoInput.dataset.valor=descuento;

    const totalFinal=total-descuento;

    const subtotal=document.getElementById(
        "subtotalVenta"
    );

    const totalVenta=document.getElementById(
        "totalVenta"
    );

    if(subtotal){

        subtotal.textContent=
            formatearDinero(total);

    }

    if(totalVenta){

        totalVenta.textContent=
            formatearDinero(totalFinal);

    }

    calcularSaldo();

}
/*
=========================================
        CAMBIAR CANTIDAD
=========================================
*/

function cambiarCantidad(id,cambio){

    const item=carrito.find(
        p=>String(p.id)===String(id)
    );

    if(!item){
        return;
    }

    const producto=obtenerProductoLocal(id);

    if(!producto){
        mostrarMensaje("Producto no encontrado.");
        return;
    }

    if(cambio>0){

        if(item.cantidad>=Number(producto.cantidad)){

            mostrarMensaje("No hay más stock.");

            return;

        }

        item.cantidad++;

    }else{

        item.cantidad--;

        if(item.cantidad<=0){

            carrito=carrito.filter(
                p=>String(p.id)!==String(id)
            );

        }

    }

    actualizarCarrito();

}
/*
=========================================
        VACIAR CARRITO
=========================================
*/

function limpiarCarrito(){

    carrito=[];

    const descuento=document.getElementById(
        "descuentoVenta"
    );

    if(descuento){

        descuento.value=0;

    }

    actualizarCarrito();

}

/*
=========================================
        TOTAL
=========================================
*/

function totalCarrito(){

    return carrito.reduce(

    (total,item)=>

    total+

    item.precio*

    item.cantidad

    ,0);

}

/*
=========================================
        Ganancia
=========================================
*/

function gananciaCarrito(){

    return carrito.reduce(

    (total,item)=>

    total+

    item.ganancia*

    item.cantidad

    ,0);

}

/*=========================================*
        CONFIRMAR VENTA
*=========================================*/

async function confirmarVenta(){

    if(carrito.length===0){

        mostrarMensaje("El carrito está vacío.");

        return;

    }

    const metodo=document.getElementById("metodoPago").value;

    const descuentoInput=document.getElementById(
        "descuentoVenta"
    );

    const descuento=obtenerNumero(descuentoInput)||0;

    const subtotal=totalCarrito();

    if(descuento<0){

        mostrarMensaje(
            "El descuento no puede ser negativo."
        );

        return;

    }

    if(descuento>subtotal){

        mostrarMensaje(
            "El descuento no puede ser mayor que el subtotal."
        );

        return;

    }

    const totalFinal=subtotal-descuento;

    /*=========================================
            DATOS DEL PAGO
    =========================================*/

    let abono=0;
    let fechaCredito="";

    if(metodo==="contado"){

        abono=totalFinal;

    }

    if(metodo==="abono" || metodo==="credito"){

        const campoAbono=document.getElementById(
            "valorAbono"
        );

        abono=obtenerNumero(campoAbono);

        if(abono<0){

            mostrarMensaje(
                "El abono no puede ser negativo."
            );

            return;

        }

        if(abono>totalFinal){

            mostrarMensaje(
                "El abono no puede ser mayor al total."
            );

            return;

        }

    }

    if(metodo==="abono" && abono<=0){

        mostrarMensaje(
            "Ingrese el valor del abono."
        );

        return;

    }

    if(metodo==="credito"){

        fechaCredito=document.getElementById(
            "fechaCredito"
        )?.value || "";

        if(fechaCredito===""){

            mostrarMensaje(
                "Seleccione una fecha límite."
            );

            return;

        }

    }

    if(!confirmar("¿Desea confirmar la venta?")){

        return;

    }

    /*=========================================
            CREAR VENTA
    =========================================*/

    const venta=crearVenta();

    const idCliente=document.getElementById(
        "clienteVenta"
    ).value;

    if(idCliente){

        venta.cliente=obtenerCliente(idCliente);

    }
    else{

        venta.cliente=null;

    }

    venta.metodoPago=metodo;

    venta.subtotal=subtotal;

    venta.descuento=descuento;

    venta.total=totalFinal;

    venta.ganancia=0;

    venta.abono=abono;

    venta.saldoPendiente=Math.max(
        totalFinal-abono,
        0
    );

    venta.estadoPago=
        venta.saldoPendiente===0
        ?"Pagado"
        :"Pendiente";

    venta.fechaCredito=fechaCredito;

    /*=========================================
            PRODUCTOS
    =========================================*/

    carrito.forEach(item=>{

        const producto=obtenerProductoLocal(item.id);

        if(!producto){

            return;

        }

        venta.productos.push({

            producto_id: producto.id,
        
            nombre: producto.nombre,
        
            cantidad: item.cantidad,
        
            precio: item.precio,
        
            costo: item.costo,
        
            subtotal: item.precio * item.cantidad,
        
            ganancia: item.ganancia * item.cantidad
        
        });

        venta.ganancia+=
            item.ganancia*item.cantidad;

    });

    venta.cantidadProductos=carrito.length;

    console.log("VENTA CREADA:", venta);
    console.log("PRODUCTOS DE LA VENTA:", venta.productos);

    /*=========================================
        GUARDAR VENTA
    =========================================*/

    try{

        const respuesta = await registrarVentaAPI(venta);

        if(!respuesta || !respuesta.ok){

            mostrarMensaje(
                respuesta?.mensaje ||
                "No se pudo registrar la venta."
            );

            return;

        }

        /* Conserva el ID real generado por MySQL */
        if(respuesta.datos?.venta_id){

            venta.id = respuesta.datos.venta_id;

        }

        /*
        Guarda la venta en la memoria local
        únicamente después de confirmar que
        MySQL la recibió correctamente.
        */

        agregarVentaDB(venta);

        registrarActividad(
            "🛒 Venta",
            `Venta por ${formatearDinero(venta.total)}`,
            {
                venta_id: respuesta.datos.id,
                cliente_id: venta.cliente?.id ?? null
            }
        );

        await actualizarDatos();

        mostrarFactura(venta);

        limpiarCarrito();

        console.log(
            "VENTA REGISTRADA EN MYSQL:",
            respuesta
        );

    }catch(error){

        console.error(
            "Error registrando venta:",
            error
        );

        mostrarMensaje(
            "No se pudo registrar la venta en la base de datos."
        );

        return;

    }

}
/*
=========================================
        FACTURA
=========================================
*/

function mostrarFactura(venta){

    let html="";

    const cliente=venta.cliente;

    html+=`

        <div class="facturaEncabezado">

            <h2>CosmetiStock</h2>

            <p>Comprobante de venta</p>

        </div>

        <hr>

    `;

    if(cliente){

        html+=`

            <p>

                <b>Cliente:</b>

                ${cliente.nombre}

                ${cliente.apellido}

            </p>

            <p>

                <b>Teléfono:</b>

                ${cliente.telefono}

            </p>

            <p>

                <b>Correo:</b>

                ${cliente.correo}

            </p>

        `;

    }else{

        html+=`

            <p>

                <b>Cliente:</b>

                Cliente ocasional

            </p>

        `;

    }

    html+="<hr>";

    html+=`

        <h3>Productos</h3>

    `;

    venta.productos.forEach(producto=>{

        html+=`

            <div class="facturaProducto">

                <strong>

                    ${producto.nombre}

                </strong>

                <p>

                    Cantidad:

                    ${producto.cantidad}

                </p>

                <p>

                    Precio:

                    ${formatearDinero(producto.precio)}

                </p>

                <div class="facturaDescuento">

                <p>
    
                    <b>Subtotal:</b>
    
                    ${formatearDinero(venta.subtotal)}
    
                </p>
    
                <p>
    
                    <b>Descuento:</b>
    
                    ${formatearDinero(venta.descuento)}
    
                </p>

            </div>

            <hr>

        `;

    });

    html+=`

        </div>

        <div class="facturaTotal">

            <h3>

                Total:

                ${formatearDinero(venta.total)}

            </h3>

        </div>

    `;

    html+=`

        <div class="facturaPago">

            <h3>Información de pago</h3>

            <p>

                <b>Forma de pago:</b>

                ${capitalizar(venta.metodoPago)}

            </p>

    `;

    if(venta.metodoPago==="contado"){

        html+=`

            <p>

                <b>Estado:</b>

                Pagado

            </p>

        `;

    }

    if(

        venta.metodoPago==="abono" ||

        venta.metodoPago==="credito"

    ){

        html+=`

            <p>

                <b>Abono:</b>

                ${formatearDinero(venta.abono)}

            </p>

            <p>

                <b>Saldo pendiente:</b>

                ${formatearDinero(

                    venta.saldoPendiente

                )}

            </p>

            <p>

                <b>Estado:</b>

                ${venta.estadoPago}

            </p>

        `;

    }

    if(

        venta.metodoPago==="credito" &&

        venta.fechaCredito

    ){

        html+=`

            <p>

                <b>Fecha límite:</b>

                ${venta.fechaCredito}

            </p>

        `;

    }

    html+=`

        </div>

        <hr>

        <p class="facturaGracias">

            Gracias por su compra.

        </p>

    `;

    abrirFactura(html);

}
/*
=========================================
        HISTORIAL
=========================================
*/

function mostrarHistorial(){

    const contenedor=

    document.getElementById("historialVentas");

    if(!contenedor) return;

    contenedor.innerHTML="";

    if(db.ventas.length===0){

        contenedor.innerHTML=

        "No hay ventas registradas.";

        return;

    }

    db.ventas

    .slice()

    .reverse()

    .forEach(venta=>{

        const div=document.createElement("div");

        div.className="venta";

        let productos="";

        venta.productos.forEach(p=>{

            productos+=`

            <li>

            ${p.cantidad} × ${p.nombre}

            </li>

            `;

        });

        div.innerHTML=`

        <h3>

        ${venta.fecha}

        </h3>

        <ul>

        ${productos}

        </ul>

        <strong>

        Total:

        ${formatearDinero(venta.total)}

        </strong>

        <br>

        <strong>

        Ganancia:

        ${formatearDinero(venta.ganancia)}

        </strong>

        `;

        contenedor.appendChild(div);

    });

}