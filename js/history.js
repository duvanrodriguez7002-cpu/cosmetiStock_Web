/*======================================*
        HISTORY.JS
    Historial de Actividades
*======================================*/

function mostrarActividadReciente(){

    const contenedor =
        document.getElementById("historialActividad");

    if(!contenedor){
        return;
    }

    if(!db.actividad || db.actividad.length===0){

        contenedor.innerHTML=`
            <div class="actividadVacia">
                <p>No hay actividades recientes.</p>
            </div>
        `;

        return;
    }

    const actividades =
        db.actividad
        .slice()
        .slice(0,10);

    let html="";

    actividades.forEach(actividad=>{

        html+=`
            <div class="actividadItem">

                <div class="actividadIcono">
                    ${actividad.tipo || "📌"}
                </div>

                <div class="actividadContenido">

                    <strong>
                        ${actividad.descripcion || "Actividad registrada"}
                    </strong>

                    <small>
                        ${actividad.fecha || ""}
                        ${actividad.hora ? " · " + actividad.hora : ""}
                    </small>

                </div>

            </div>
        `;

    });

    contenedor.innerHTML=html;
}