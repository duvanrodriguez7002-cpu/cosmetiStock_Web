/*
=========================================
        CLIENTE.JS
    Gestión de Clientes
=========================================
*/

let clienteEditando = null;

/*
=========================================
        NUEVO CLIENTE
=========================================
*/

function nuevoCliente(){
    clienteEditando = null;
    limpiarFormularioCliente();
    abrirModalCliente();
}

/*
=========================================
        ABRIR MODAL
=========================================
*/

function abrirModalCliente(){
    document
        .getElementById("modalCliente")
        .classList
        .remove("oculto");
}

/*
=========================================
        CERRAR MODAL
=========================================
*/

function cerrarModalCliente(){
    document
        .getElementById("modalCliente")
        .classList
        .add("oculto");
}

/*
=========================================
        LIMPIAR FORMULARIO
=========================================
*/

function limpiarFormularioCliente(){
    document.getElementById("clienteNombre").value = "";
    document.getElementById("clienteApellido").value = "";
    document.getElementById("clienteTelefono").value = "";
    document.getElementById("clienteCorreo").value = "";
    document.getElementById("clienteDireccion").value = "";
}

/*
=========================================
        CARGAR FORMULARIO
=========================================
*/

function cargarFormularioCliente(cliente){

    /* Guardamos únicamente el ID del cliente */
    clienteEditando = cliente.id;

    document.getElementById("clienteNombre").value =
        cliente.nombre || "";

    document.getElementById("clienteApellido").value =
        cliente.apellido || "";

    document.getElementById("clienteTelefono").value =
        cliente.telefono || "";

    document.getElementById("clienteCorreo").value =
        cliente.correo || "";

    document.getElementById("clienteDireccion").value =
        cliente.direccion || "";

    abrirModalCliente();
}

/*
=========================================
        GUARDAR CLIENTE
=========================================
*/

async function guardarCliente(){

    const datos = {
        nombre: document.getElementById("clienteNombre").value.trim(),
        apellido: document.getElementById("clienteApellido").value.trim(),
        telefono: document.getElementById("clienteTelefono").value.trim(),
        correo: document.getElementById("clienteCorreo").value.trim(),
        direccion: document.getElementById("clienteDireccion").value.trim()
    };

    if(datos.nombre === ""){
        mostrarMensaje("Ingrese el nombre del cliente.");
        return;
    }

    /*
    =========================================
        COMPROBAR TELÉFONO REPETIDO
    =========================================
    */

    if(datos.telefono !== ""){

        const repetido = db.clientes.find(cliente =>
            cliente.telefono === datos.telefono &&
            (
                !clienteEditando ||
                String(cliente.id) !== String(clienteEditando)
            )
        );

        if(repetido){
            mostrarMensaje(
                "Ya existe un cliente con ese teléfono."
            );
            return;
        }
    }

    try{

        /*
        =========================================
            EDITAR CLIENTE
        =========================================
        */

        if(clienteEditando){

            const cliente = obtenerCliente(clienteEditando);

            if(!cliente){
                mostrarMensaje(
                    "No se encontró el cliente que desea editar."
                );
                return;
            }

            const respuesta = await editarClienteAPI({
                id: clienteEditando,
                nombre: datos.nombre,
                apellido: datos.apellido,
                telefono: datos.telefono,
                correo: datos.correo,
                direccion: datos.direccion
            });

            if(!respuesta || !respuesta.ok){
                throw new Error(
                    respuesta?.mensaje ||
                    "No se pudo actualizar el cliente."
                );
            }

            registrarActividad(
                "✏ Cliente",
                `Se editó ${datos.nombre} ${datos.apellido}`.trim(),
                {
                    cliente_id: clienteEditando.id || null
                }
            );

            mostrarMensaje(
                "Cliente actualizado correctamente."
            );
        }

        /*
        =========================================
            CREAR CLIENTE
        =========================================
        */

        else{

            const respuesta = await crearClienteAPI({
                nombre: datos.nombre,
                apellido: datos.apellido,
                telefono: datos.telefono,
                correo: datos.correo,
                direccion: datos.direccion
            });

            if(!respuesta || !respuesta.ok){
                throw new Error(
                    respuesta?.mensaje ||
                    "No se pudo crear el cliente."
                );
            }

            registrarActividad(
                "➕ Cliente",
                `Se creó ${datos.nombre} ${datos.apellido}`.trim(),
                {
                    cliente_id: respuesta.datos?.id || null
                }
            );

            mostrarMensaje(
                "Cliente creado correctamente."
            );
        }

        /*
        =========================================
            VOLVER A CARGAR DESDE MYSQL
        =========================================
        */

        const sincronizado =
            await cargarClientesDesdeBackend();

        if(sincronizado){
            mostrarClientes();
        }

        clienteEditando = null;
        cerrarModalCliente();

    }
    catch(error){

        console.error(
            "Error guardando cliente:",
            error
        );

        mostrarMensaje(
            error.message ||
            "No se pudo guardar el cliente."
        );
    }
}

/*
=========================================
        EDITAR CLIENTE
=========================================
*/

function editarCliente(id){

    const cliente = obtenerCliente(id);

    if(!cliente){
        mostrarMensaje(
            "No se encontró el cliente."
        );
        return;
    }

    cargarFormularioCliente(cliente);
}

/*
=========================================
        ELIMINAR CLIENTE
=========================================
*/

async function eliminarCliente(id){

    const cliente = obtenerCliente(id);

    if(!cliente){
        return;
    }

    if(!confirmar(
        `¿Desea eliminar al cliente ${cliente.nombre} ${cliente.apellido}?`
    )){
        return;
    }

    try{

        const respuesta =
            await eliminarClienteAPI(id);

        /*
        =========================================
            ELIMINACIÓN FÍSICA
        =========================================
        */

        if(respuesta.datos?.accion === "eliminado"){

            registrarActividad(
                "🗑 Cliente",
                `Se eliminó ${cliente.nombre} ${cliente.apellido}`.trim(),
                {
                    cliente_id: cliente.id || null
                }
            );

            mostrarMensaje(
                "Cliente eliminado correctamente."
            );
        }

        /*
        =========================================
            DESACTIVACIÓN POR HISTORIAL
        =========================================
        */

        else if(respuesta.datos?.accion === "desactivado"){

            registrarActividad(
                "🚫 Cliente",
                `Se desactivó ${cliente.nombre} ${cliente.apellido} porque tiene ventas registradas.`.trim(),
                {
                    cliente_id: cliente.id || null
                }
            );

            mostrarMensaje(
                "El cliente tiene ventas registradas y fue desactivado para conservar su historial."
            );
        }

        /*
        =========================================
            VOLVER A CARGAR DESDE MYSQL
        =========================================
        */

        const sincronizado =
            await cargarClientesDesdeBackend();

        if(sincronizado){
            mostrarClientes();
        }

    }
    catch(error){

        console.error(
            "Error eliminando cliente:",
            error
        );

        mostrarMensaje(
            error.message ||
            "No se pudo eliminar el cliente."
        );
    }
}

/*
=========================================
        MOSTRAR CLIENTES
=========================================
*/

function mostrarClientes(){

    const texto =
        document
            .getElementById("buscarCliente")
            ?.value
            .toLowerCase()
            .trim() || "";

    let clientes = [...db.clientes];

    if(texto !== ""){

        clientes = clientes.filter(cliente => {

            const nombre =
                `${cliente.nombre || ""} ${cliente.apellido || ""}`
                    .toLowerCase();

            const telefono =
                (cliente.telefono || "").toLowerCase();

            const correo =
                (cliente.correo || "").toLowerCase();

            const direccion =
                (cliente.direccion || "").toLowerCase();

            return (
                nombre.includes(texto) ||
                telefono.includes(texto) ||
                correo.includes(texto) ||
                direccion.includes(texto)
            );
        });
    }

    mostrarListaClientes(clientes);
}

/*
=========================================
        LISTA CLIENTES
=========================================
*/

function mostrarListaClientes(clientes){

    const contenedor =
        document.getElementById("listaClientes");

    if(!contenedor){
        return;
    }

    contenedor.innerHTML = "";

    /*
    =========================================
        SIN CLIENTES
    =========================================
    */

    if(clientes.length === 0){

        contenedor.innerHTML = `
            <div class="card">
                <h3>No hay clientes registrados.</h3>
            </div>
        `;

        document.getElementById("totalClientes").textContent = 0;
        document.getElementById("clientesActivos").textContent = 0;

        return;
    }

    /*
    =========================================
        MOSTRAR CLIENTES
    =========================================
    */

    clientes.forEach(cliente => {

        const nombre =
            cliente.nombre || "";

        const apellido =
            cliente.apellido || "";

        const telefono =
            cliente.telefono || "No registrado";

        const correo =
            cliente.correo || "No registrado";

        const direccion =
            cliente.direccion || "No registrada";

        const fecha =
            cliente.fechaRegistro ||
            cliente.fecha_creacion ||
            "No disponible";

        const inicial =
            nombre.charAt(0).toUpperCase();

        contenedor.innerHTML += `
        <div class="cliente">

            <div class="cliente-header">

                <div class="cliente-avatar">
                    ${inicial}
                </div>

                <div>
                    <h3>${nombre} ${apellido}</h3>
                    <small>Cliente registrado</small>
                </div>

            </div>

            <div class="cliente-info">

                <p>
                    📞
                    <strong>Teléfono:</strong>
                    ${telefono}
                </p>

                <p>
                    📫
                    <strong>Correo:</strong>
                    ${correo}
                </p>

                <p>
                    📍
                    <strong>Dirección:</strong>
                    ${direccion}
                </p>

                <p>
                    📅
                    <strong>Registro:</strong>
                    ${fecha}
                </p>

            </div>

            <hr>

            <div class="cliente-botones">

                <button
                    class="btn-editar-cliente"
                    onclick="editarCliente('${cliente.id}')">
                    ✏ Editar
                </button>

                <button
                    class="btn-eliminar-cliente"
                    onclick="eliminarCliente('${cliente.id}')">
                    🗑 Eliminar
                </button>

            </div>

        </div>
        `;
    });

    /*
    =========================================
        RESUMEN
    =========================================
    */

    document.getElementById("totalClientes").textContent =
        db.clientes.length;

    document.getElementById("clientesActivos").textContent =
        db.clientes.filter(cliente => cliente.activo).length;
}