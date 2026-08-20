/*
=========================================
            UTILS.JS
=========================================
*/

/*
=========================================
        GENERAR ID
=========================================
*/

function generarID(){

    return Date.now().toString(36)

        + Math.random().toString(36).substring(2,8);

}

/*
=========================================
        FECHA ACTUAL
=========================================
*/

function obtenerFecha(){
    return new Date().toLocaleString("es-CO", {
        timeZone: "America/Bogota"
    });
}

/*======================================*
* FORMATO MONEDA
*======================================*/

function formatearDinero(valor){

    return "$" + Number(valor || 0).toLocaleString(
        "es-CO",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    );

}

function formatearDineroInput(input){

    if(!input){
        return;
    }

    let valor=input.value
        .replace(/\D/g,"");

    if(valor===""){

        input.value="";

        return;

    }

    input.value=Number(valor).toLocaleString(
        "es-CO",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    );

}

function obtenerNumero(input){

    if(!input){
        return 0;
    }

    let valor=input.value
        .toString()
        .replace(/\./g,"")
        .replace(/,/g,"")
        .replace(/\D/g,"");

    return Number(valor)||0;
}

/*
=========================================
        CALCULAR GANANCIA
=========================================
*/

function calcularGanancia(

    costo,

    precio

){

    return Number(precio)-Number(costo);

}

/*
=========================================
        CAPITALIZAR
=========================================
*/

function capitalizar(texto){

    if(!texto) return "";

    return texto.charAt(0).toUpperCase()

    + texto.slice(1);

}

/*
=========================================
    CONVERTIR Y COMPRIMIR IMAGEN
=========================================
*/

function convertirImagenBase64(archivo){

    return new Promise((resolve,reject)=>{

        if(!archivo){

            resolve("");

            return;

        }

        const lector = new FileReader();

        lector.onload = e => {

            const imagen = new Image();

            imagen.onload = () => {

                const maxAncho = 1000;
                const maxAlto = 1000;

                let ancho = imagen.width;
                let alto = imagen.height;

                if(ancho > maxAncho || alto > maxAlto){

                    const escala = Math.min(
                        maxAncho / ancho,
                        maxAlto / alto
                    );

                    ancho = Math.round(ancho * escala);
                    alto = Math.round(alto * escala);

                }

                const canvas = document.createElement("canvas");

                canvas.width = ancho;
                canvas.height = alto;

                const contexto = canvas.getContext("2d");

                contexto.drawImage(
                    imagen,
                    0,
                    0,
                    ancho,
                    alto
                );

                const resultado = canvas.toDataURL(
                    "image/webp",
                    0.80
                );

                resolve(resultado);

            };

            imagen.onerror = () => {

                reject(
                    "No fue posible procesar la imagen."
                );

            };

            imagen.src = e.target.result;

        };

        lector.onerror = () => {

            reject(
                "No fue posible leer la imagen."
            );

        };

        lector.readAsDataURL(archivo);

    });

}

// mostrar vista previa de la imagen seleccionada en el formulario

function mostrarVistaPrevia(){

    const input = document.getElementById("imagen");

    const preview = document.getElementById("previewImagen");

    if(!input || !preview){

        return;

    }

    if(input.files.length === 0){

        preview.style.display = "none";
        preview.src = "";

        return;

    }

    const archivo = input.files[0];

    convertirImagenBase64(archivo)
        .then(imagen => {

            preview.src = imagen;

            preview.style.display = "block";

        })
        .catch(error => {

            console.error(
                "Error procesando imagen:",
                error
            );

            preview.src = "";
            preview.style.display = "none";

            mostrarMensaje(
                "No fue posible procesar la imagen."
            );

        });

}
/*
=========================================
        CODIGO AUTOMATICO
=========================================
*/

function prefijoCategoria(categoria){

    switch(categoria){

        case "Cosméticos":
            return "COS";

        case "Maquillaje":
            return "MAQ";

        case "Cuidado Facial":
            return "FAC";

        case "Cuidado Corporal":
            return "COR";

        case "Cabello":
            return "CAB";

        case "Perfumería":
            return "PER";

        case "Manualidades":
            return "MAN";

        case "Papelería":
            return "PAP";

        case "Accesorios":
            return "ACC";

        default:
            return "PRO";

    }

}

function generarCodigoProducto(categoria){

    const prefijo = prefijoCategoria(categoria);

    let mayor = 0;

    db.productos.forEach(producto=>{

        if(!producto.codigo) return;

        if(!producto.codigo.startsWith(prefijo)) return;

        const numero = Number(

            producto.codigo.split("-")[1]

        );

        if(numero>mayor){

            mayor=numero;

        }

    });

    mayor++;

    return prefijo+"-"+String(mayor).padStart(4,"0");

}