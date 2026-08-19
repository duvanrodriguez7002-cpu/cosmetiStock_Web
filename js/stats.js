/*
    STATS.JS
    Estadísticas y funciones compartidas del sistema
*/

/*======================================*
        DASHBOARD
*=======================================*/

function actualizarDashboard(){

    const totalProductos =
        document.getElementById("totalProductos");

    if(totalProductos){
        totalProductos.textContent =
            db.productos.length;
    }

    const totalStockElemento =
        document.getElementById("totalStock");

    if(totalStockElemento){
        totalStockElemento.textContent =
            totalStock();
    }

    const gananciaTotalElemento =
        document.getElementById("gananciaTotal");

    if(gananciaTotalElemento){
        gananciaTotalElemento.textContent =
            formatearDinero(totalGanancias());
    }

    const ventasTotalesElemento =
        document.getElementById("ventasTotales");

    if(ventasTotalesElemento){
        ventasTotalesElemento.textContent =
            db.ventas.length;
    }

    const stockBajoElemento =
        document.getElementById("stockBajo");

    if(stockBajoElemento){
        stockBajoElemento.textContent =
            productosStockBajo().length;
    }

    const totalCategoriasElemento =
        document.getElementById("totalCategorias");

    if(totalCategoriasElemento){
        totalCategoriasElemento.textContent =
            contarCategorias();
    }
}

/*======================================*
        ESTADÍSTICAS
*=======================================*/

function actualizarEstadisticas(){

    actualizarResumenGeneral();

    actualizarUnidadesVendidas();

    actualizarEstadoPagos();

    actualizarTopProductos();

    actualizarResumenInventario();

    actualizarCategorias();
}

/*======================================*
        TOTAL STOCK
*=======================================*/

function totalStock(){

    return db.productos.reduce(

        (total, producto) =>

            total +
            Number(producto.cantidad || 0),

        0
    );
}

/*======================================*
        GANANCIAS TOTALES
*=======================================*/

function totalGanancias(){

    return db.ventas.reduce(

        (total, venta) =>

            total +
            Number(venta.ganancia || 0),

        0
    );
}

/*======================================*
        PRODUCTOS STOCK BAJO
*=======================================*/

function productosStockBajo(){

    return db.productos.filter(

        producto =>

            Number(producto.cantidad || 0) <=
            Number(producto.stockMinimo || 0)

    );
}

/*======================================*
        RESUMEN GENERAL
*=======================================*/

function actualizarResumenGeneral(){

    const ventas =
        document.getElementById(
            "estadisticasVentas"
        );

    const ingresos =
        document.getElementById(
            "estadisticasIngresos"
        );

    const ganancia =
        document.getElementById(
            "estadisticasGanancia"
        );

    if(ventas){

        ventas.textContent =
            db.ventas.length;
    }

    if(ingresos){

        const totalIngresos =
            db.ventas.reduce(

                (total, venta) =>

                    total +
                    Number(venta.total || 0),

                0
            );

        ingresos.textContent =
            formatearDinero(
                totalIngresos
            );
    }

    if(ganancia){

        ganancia.textContent =
            formatearDinero(
                totalGanancias()
            );
    }
}

/*======================================*
        PRODUCTO MÁS VENDIDO
        FUNCIÓN COMPARTIDA
*=======================================*/

function actualizarMasVendido(){

    const elemento =
        document.getElementById(
            "masVendido"
        );

    if(!elemento){
        return;
    }

    if(
        !db.productos ||
        db.productos.length === 0
    ){

        elemento.textContent = "-";

        return;
    }

    let producto =
        db.productos[0];

    db.productos.forEach(p => {

        if(
            Number(p.vendidos || 0) >
            Number(producto.vendidos || 0)
        ){

            producto = p;
        }
    });

    elemento.textContent =

        producto.nombre +

        " (" +

        Number(
            producto.vendidos || 0
        ) +

        " vendidos)";
}

/*======================================*
        PRODUCTO MENOS VENDIDO
        FUNCIÓN COMPARTIDA
*=======================================*/

function actualizarMenosVendido(){

    const elemento =
        document.getElementById(
            "menosVendido"
        );

    if(!elemento){
        return;
    }

    if(
        !db.productos ||
        db.productos.length === 0
    ){

        elemento.textContent = "-";

        return;
    }

    let producto =
        db.productos[0];

    db.productos.forEach(p => {

        if(
            Number(p.vendidos || 0) <
            Number(producto.vendidos || 0)
        ){

            producto = p;
        }
    });

    elemento.textContent =

        producto.nombre +

        " (" +

        Number(
            producto.vendidos || 0
        ) +

        " vendidos)";
}

/*======================================*
        UTILIDAD
        FUNCIÓN COMPARTIDA
*=======================================*/

function actualizarUtilidad(){

    const elemento =
        document.getElementById(
            "utilidad"
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        formatearDinero(
            totalGanancias()
        );
}

/*======================================*
        UTILIDAD ACUMULADA
        FUNCIÓN COMPARTIDA
*=======================================*/

function actualizarUtilidadAcumulada(){

    const elemento =
        document.getElementById(
            "utilidadAcumulada"
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        formatearDinero(
            totalGanancias()
        );
}

/*======================================*
        TOTAL UNIDADES VENDIDAS
*=======================================*/

function totalUnidadesVendidas(){

    let total = 0;

    db.productos.forEach(producto => {

        total +=
            Number(
                producto.vendidos || 0
            );
    });

    return total;
}

/*======================================*
        ACTUALIZAR UNIDADES VENDIDAS
*=======================================*/

function actualizarUnidadesVendidas(){

    const elemento =
        document.getElementById(
            "unidadesVendidas"
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        totalUnidadesVendidas();
}

/*======================================*
        ESTADO DE PAGOS
*=======================================*/

function actualizarEstadoPagos(){

    const contado =
        document.getElementById(
            "ventasContado"
        );

    const abono =
        document.getElementById(
            "ventasAbono"
        );

    const credito =
        document.getElementById(
            "ventasCredito"
        );

    const saldo =
        document.getElementById(
            "saldoPendienteTotal"
        );

    let totalContado = 0;
    let totalAbono = 0;
    let totalCredito = 0;
    let saldoPendiente = 0;

    db.ventas.forEach(venta => {

        const metodo =
            venta.metodoPago || "";

        if(metodo === "contado"){
            totalContado++;
        }

        if(metodo === "abono"){
            totalAbono++;
        }

        if(metodo === "credito"){
            totalCredito++;
        }

        saldoPendiente +=
            Number(
                venta.saldoPendiente || 0
            );
    });

    if(contado){

        contado.textContent =
            totalContado;
    }

    if(abono){

        abono.textContent =
            totalAbono;
    }

    if(credito){

        credito.textContent =
            totalCredito;
    }

    if(saldo){

        saldo.textContent =
            formatearDinero(
                saldoPendiente
            );
    }
}

/*======================================*
        CONTAR CATEGORÍAS
*=======================================*/

function contarCategorias(){

    const categorias = [];

    db.productos.forEach(producto => {

        if(

            producto.categoria &&

            !categorias.includes(
                producto.categoria
            )

        ){

            categorias.push(
                producto.categoria
            );
        }
    });

    return categorias.length;
}

/*======================================*
        TOP 5 PRODUCTOS
*=======================================*/

function topProductos(){

    return [...db.productos]

        .sort(

            (a, b) =>

                Number(
                    b.vendidos || 0
                ) -

                Number(
                    a.vendidos || 0
                )

        )

        .slice(0, 5);
}

/*======================================*
        MOSTRAR TOP 5
*=======================================*/

function actualizarTopProductos(){

    const contenedor =
        document.getElementById(
            "topProductos"
        );

    if(!contenedor){
        return;
    }

    const productos =
        topProductos();

    if(productos.length === 0){

        contenedor.innerHTML = `

            <p class="descripcionEstadistica">

                No hay productos registrados.

            </p>

        `;

        return;
    }

    let html = "";

    productos.forEach(
        (producto, index) => {

            html += `

                <div class="productoEstadistica">

                    <div class="productoEstadisticaNumero">

                        ${index + 1}

                    </div>

                    <div class="productoEstadisticaInfo">

                        <strong>

                            ${producto.nombre}

                        </strong>

                        <small>

                            Código:
                            ${producto.codigo || "-"}

                        </small>

                    </div>

                    <div class="productoEstadisticaVentas">

                        <strong>

                            ${Number(
                                producto.vendidos || 0
                            )}

                        </strong>

                        <small>

                            vendidos

                        </small>

                    </div>

                </div>

            `;
        }
    );

    contenedor.innerHTML =
        html;
}

/*======================================*
        PRODUCTOS CRÍTICOS
*=======================================*/

function productosCriticos(){

    return db.productos.filter(

        producto =>

            Number(
                producto.cantidad || 0
            ) <=

            Number(
                producto.stockMinimo || 0
            )

    );
}

/*======================================*
        RESUMEN INVENTARIO
*=======================================*/

function actualizarResumenInventario(){

    const valorInventario =

        db.productos.reduce(

            (total, producto) =>

                total +

                (
                    Number(
                        producto.costo || 0
                    ) *

                    Number(
                        producto.cantidad || 0
                    )
                ),

            0
        );

    const ganancia =

        db.productos.reduce(

            (total, producto) =>

                total +

                (
                    Number(
                        producto.ganancia || 0
                    ) *

                    Number(
                        producto.cantidad || 0
                    )
                ),

            0
        );

    const resInventario =
    document.getElementById(
            "resInventario"
        );

    const resUtilidad =
        document.getElementById(
            "resUtilidad"
        );

    if(resInventario){

        resInventario.textContent =
            formatearDinero(
                valorInventario
            );
    }

    if(resUtilidad){

        resUtilidad.textContent =
            formatearDinero(
                ganancia
            );
    }
}

/*======================================*
        RESUMEN POR CATEGORÍAS
*=======================================*/

function actualizarCategorias(){

    const contenedor =
        document.getElementById(
            "tablaCategorias"
        );

    if(!contenedor){
        return;
    }

    const categorias = {};

    db.productos.forEach(producto => {

        const categoria =
            producto.categoria ||
            "Sin categoría";

        if(!categorias[categoria]){

            categorias[categoria] = {

                cantidad: 0,

                unidades: 0,

                inventario: 0,

                ganancia: 0
            };
        }

        categorias[categoria].cantidad++;

        categorias[categoria].unidades +=
            Number(
                producto.cantidad || 0
            );

        categorias[categoria].inventario +=

            Number(
                producto.costo || 0
            ) *

            Number(
                producto.cantidad || 0
            );

        categorias[categoria].ganancia +=

            Number(
                producto.ganancia || 0
            ) *

            Number(
                producto.cantidad || 0
            );
    });

    if(
        Object.keys(categorias).length === 0
    ){

        contenedor.innerHTML = `

            <p class="descripcionEstadistica">

                No hay productos registrados.

            </p>

        `;

        return;
    }

    let html = `

        <div class="tablaResponsive">

            <table class="tablaCategorias">

                <thead>

                    <tr>

                        <th>Categoría</th>

                        <th>Productos</th>

                        <th>Unidades</th>

                        <th>Valor del inventario</th>

                        <th>Ganancia potencial</th>

                    </tr>

                </thead>

                <tbody>

    `;

    for(
        const categoria in categorias
    ){

        const datos =
            categorias[categoria];

        html += `

            <tr>

                <td>
                    ${categoria}
                </td>

                <td>
                    ${datos.cantidad}
                </td>

                <td>
                    ${datos.unidades}
                </td>

                <td>
                    ${formatearDinero(
                        datos.inventario
                    )}
                </td>

                <td>
                    ${formatearDinero(
                        datos.ganancia
                    )}
                </td>

            </tr>

        `;
    }

    html += `

                </tbody>

            </table>

        </div>

    `;

    contenedor.innerHTML =
        html;
}
