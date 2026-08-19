/*======================================*
        DASHBOARD.JS
    Funciones del panel principal
*======================================*/


/*======================================*
        ACTUALIZAR DASHBOARD
*======================================*/

function actualizarDashboard(){

    const totalProductos=
        document.getElementById("totalProductos");

    const totalStock=
        document.getElementById("totalStock");

    const gananciaTotal=
        document.getElementById("gananciaTotal");

    const ventasTotales=
        document.getElementById("ventasTotales");

    const stockBajo=
        document.getElementById("stockBajo");

    const totalCategorias=
        document.getElementById("totalCategorias");


    /* PRODUCTOS */

    if(totalProductos){

        totalProductos.textContent=
            db.productos.filter(
                producto=>producto.activo!==false
            ).length;

    }


    /* UNIDADES EN INVENTARIO */

    if(totalStock){

        const stock=db.productos.reduce(

            (total,producto)=>
                total+
                (Number(producto.cantidad)||0),

            0

        );

        totalStock.textContent=stock;

    }


    /* GANANCIA ACUMULADA */

    if(gananciaTotal){

        const ganancia=db.ventas.reduce(

            (total,venta)=>
                total+
                (Number(venta.ganancia)||0),

            0

        );

        gananciaTotal.textContent=
            formatearDinero(ganancia);

    }


    /* VENTAS REALIZADAS */

    if(ventasTotales){

        ventasTotales.textContent=
            db.ventas.length;

    }


    /* PRODUCTOS CON STOCK BAJO */

    if(stockBajo){

        const bajos=db.productos.filter(producto=>{

            const cantidad=
                Number(producto.cantidad)||0;

            return producto.activo!==false &&
                   cantidad>0 &&
                   cantidad<=5;

        }).length;

        stockBajo.textContent=bajos;

    }


    /* CATEGORÍAS */

    if(totalCategorias){

        const categorias=[

            ...new Set(

                db.productos

                .filter(
                    producto=>producto.activo!==false
                )

                .map(
                    producto=>producto.categoria
                )

                .filter(Boolean)

            )

        ];

        totalCategorias.textContent=
            categorias.length;

    }


    mostrarAlertas();

    mostrarCuentasPorCobrar();

    mostrarActividadReciente();

}


/*======================================*
        ALERTAS DEL SISTEMA
*======================================*/

function mostrarAlertas(){

    const contenedor=
        document.getElementById("listaAlertas");

    if(!contenedor) return;

    contenedor.innerHTML="";


    const productosAgotados=
        db.productos.filter(producto=>{

            return producto.activo!==false &&
                   Number(producto.cantidad)===0;

        });


    const productosStockBajo =
        db.productos.filter(producto => {
    
            const cantidad =
                Number(producto.cantidad) || 0;
    
            const stockMinimo =
                Number(
                    producto.stock_minimo ??
                    producto.stockMinimo ??
                    5
                );
    
            return producto.activo !== false &&
                   cantidad > 0 &&
                   cantidad <= stockMinimo;
    
        });

    const productosSinImagen =
        db.productos.filter(producto => {
    
            const imagen =
                producto.imagen?.toString().trim() || "";
    
            return producto.activo !== false &&
                   imagen === "";
    
        });

    const cuentasPendientes=
        db.ventas.filter(venta=>{

            return Number(venta.saldoPendiente)>0;

        });


    if(

        productosAgotados.length===0 &&
        productosStockBajo.length===0 &&
        productosSinImagen.length===0 &&
        cuentasPendientes.length===0

    ){

        contenedor.innerHTML=`

            <p class="vacio">

                No hay alertas pendientes.

            </p>

        `;

        return;

    }


    /* PRODUCTOS AGOTADOS */

    productosAgotados.forEach(producto=>{

        const alerta=
            document.createElement("div");

        alerta.className="alerta";

        alerta.innerHTML=`

            <strong>
                ⚠️ Producto agotado
            </strong>

            <p>
                ${producto.nombre}
            </p>

        `;

        contenedor.appendChild(alerta);

    });


    /* STOCK BAJO */

    productosStockBajo.forEach(producto=>{

        const alerta=
            document.createElement("div");

        alerta.className="alerta";

        alerta.innerHTML=`

            <strong>
                📦 Stock bajo
            </strong>

            <p>

                ${producto.nombre}

                — quedan

                ${producto.cantidad}

                unidades.

            </p>

        `;

        contenedor.appendChild(alerta);

    });

    /* PRODUCTOS SIN IMAGEN */

    productosSinImagen.forEach(producto=>{

        const alerta=
            document.createElement("div");

        alerta.className="alerta";

        alerta.innerHTML=`

            <strong>
                🖼️ Producto sin imagen
            </strong>

            <p>
                ${producto.nombre}
            </p>

        `;

        contenedor.appendChild(alerta);

    });


    /* CUENTAS POR COBRAR */

    if(cuentasPendientes.length>0){

        const alerta=
            document.createElement("div");

        alerta.className="alerta";

        alerta.innerHTML=`

            <strong>
                💰 Pagos pendientes
            </strong>

            <p>

                Hay

                ${cuentasPendientes.length}

                venta(s) con saldo pendiente.

            </p>

        `;

        contenedor.appendChild(alerta);

    }

}


/*======================================*
        CUENTAS POR COBRAR
*======================================*/

function mostrarCuentasPorCobrar(){

    const contenedor=
        document.getElementById(
            "listaCuentasCobrar"
        );

    const totalContenedor=
        document.getElementById(
            "totalPorCobrar"
        );


    if(!contenedor) return;


    contenedor.innerHTML="";


    let totalPendiente=0;


    const cuentas=db.ventas.filter(venta=>{

        return Number(venta.saldoPendiente)>0;

    });


    if(cuentas.length===0){

        contenedor.innerHTML=`

            <p class="vacio">

                No hay cuentas pendientes
                por cobrar.

            </p>

        `;

        if(totalContenedor){

            totalContenedor.textContent=
                formatearDinero(0);

        }

        return;

    }


    cuentas
    .slice()
    .reverse()
    .forEach(venta=>{

        const pendiente=
            Number(venta.saldoPendiente)||0;

        const abono=
            Number(venta.abono)||0;

        const total=
            Number(venta.total)||0;


        totalPendiente+=pendiente;


        const cliente=venta.cliente;


        const nombreCliente=cliente

            ? `${cliente.nombre} ${cliente.apellido}`

            : "Cliente ocasional";


        const div=
            document.createElement("div");


        div.className="cuentaCobrar";


        div.innerHTML=`

            <div class="cuentaInfo">

                <h3>

                    ${nombreCliente}

                </h3>

                <small>

                    Forma de pago:

                    ${capitalizar(
                        venta.metodoPago
                    )}

                </small>

                <small>

                    Total:

                    ${formatearDinero(total)}

                </small>

                <small>

                    Abonado:

                    ${formatearDinero(abono)}

                </small>

                <strong>

                    Pendiente:

                    ${formatearDinero(pendiente)}

                </strong>

                ${
                    venta.fechaCredito

                    ? `

                        <small>

                            Fecha límite:

                            ${venta.fechaCredito}

                        </small>

                    `

                    : ""
                }

            </div>


            <div class="cuentaAcciones">

                <button
                    onclick="registrarPago('${venta.id}')"
                >

                    Registrar pago

                </button>

            </div>

        `;


        contenedor.appendChild(div);

    });


    if(totalContenedor){

        totalContenedor.textContent=
            formatearDinero(totalPendiente);

    }

}

/*======================================*
        REGISTRAR PAGO
*======================================*/

async function registrarPago(idVenta){

    const venta = db.ventas.find(
        venta => Number(venta.id) === Number(idVenta)
    );

    if(!venta){

        mostrarMensaje(
            "No se encontró la venta."
        );

        return;

    }

    const pendiente =
        Number(venta.saldoPendiente) || 0;

    if(pendiente <= 0){

        mostrarMensaje(
            "Esta venta ya está pagada."
        );

        return;

    }

    const pago = prompt(
        `Saldo pendiente: ${formatearDinero(pendiente)}\n\n` +
        `Ingrese el valor del pago:`
    );

    if(pago === null){

        return;

    }

    const valorPago = Number(pago);

    if(
        !Number.isFinite(valorPago) ||
        valorPago <= 0
    ){

        mostrarMensaje(
            "Ingrese un valor de pago válido."
        );

        return;

    }

    if(valorPago > pendiente){

        mostrarMensaje(
            "El pago no puede ser mayor al saldo pendiente."
        );

        return;

    }

    try{

        /*
        =========================================
            GUARDAR PAGO EN MYSQL
        =========================================
        */

        const respuesta =
            await registrarPagoAPI(
                venta.id,
                valorPago
            );

        if(
            !respuesta ||
            !respuesta.ok
        ){

            throw new Error(
                respuesta?.mensaje ||
                "No se pudo registrar el pago."
            );

        }

        /*
        =========================================
            ACTUALIZAR VENTA LOCAL
        =========================================
        */

        venta.abono =
            (Number(venta.abono) || 0) +
            valorPago;

        venta.saldoPendiente =
            Math.max(
                Number(venta.total) -
                venta.abono,
                0
            );

        venta.estadoPago =
            venta.saldoPendiente === 0
                ? "Pagado"
                : "Pendiente";

        /*
        =========================================
            GUARDAR CAMBIOS LOCALES
        =========================================
        */

        guardarCambios();

        /*
        =========================================
            REGISTRAR ACTIVIDAD
        =========================================
        */

        registrarActividad(
            "💰 Pago recibido",
            `${
                venta.cliente
                    ? venta.cliente.nombre + " " +
                      venta.cliente.apellido
                    : "Cliente ocasional"
            } abonó ${formatearDinero(valorPago)}`,
            {
                venta_id: venta.id,
                cliente_id:
                    venta.cliente?.id ?? null,
                pago_id:
                    respuesta.datos?.pago_id ??
                    respuesta.datos?.id ??
                    null
            }
        );

        /*
        =========================================
            ACTUALIZAR PANTALLA
        =========================================
        */

        mostrarCuentasPorCobrar();

        mostrarActividadReciente();

        mostrarMensaje(
            "Pago registrado correctamente."
        );

    }
    catch(error){

        console.error(
            "Error registrando pago:",
            error
        );

        mostrarMensaje(
            error.message ||
            "No se pudo registrar el pago."
        );

    }

}