/*
=========================================
        SERVICE WORKER - COSMETISTOCK
=========================================
*/

const CACHE_VERSION = "cosmetistock-v1.0.3";

const ARCHIVOS = [

    "./",
    "./index.html",
    "./manifest.json",

    /*
    =========================================
            CSS
    =========================================
    */

    "./css/style.css",

    /*
    =========================================
            JAVASCRIPT
    =========================================
    */

    "./js/api.js",
    "./js/app.js",
    "./js/cliente.js",
    "./js/dashboard.js",
    "./js/database.js",
    "./js/history.js",
    "./js/inventory.js",
    "./js/sales.js",
    "./js/stats.js",
    "./js/storage.js",
    "./js/ui.js",
    "./js/utils.js"

];

/*
=========================================
        INSTALACIÓN
=========================================
*/

self.addEventListener("install", event => {

    console.log(
        "Service Worker instalando:",
        CACHE_VERSION
    );

    event.waitUntil(

        caches.open(CACHE_VERSION)

            .then(async cache => {

                console.log(
                    "Cargando archivos actualizados..."
                );

                for(const archivo of ARCHIVOS){

                    try{

                        const url =
                            new URL(
                                archivo,
                                self.registration.scope
                            ).href;

                        const respuesta =
                            await fetch(
                                url,
                                {
                                    cache: "no-cache"
                                }
                            );

                        if(!respuesta.ok){

                            console.warn(
                                "No se pudo cargar:",
                                url,
                                respuesta.status
                            );

                            continue;

                        }

                        await cache.put(
                            url,
                            respuesta.clone()
                        );

                        console.log(
                            "✓ Archivo actualizado:",
                            archivo
                        );

                    }
                    catch(error){

                        console.warn(
                            "⚠ Error cargando:",
                            archivo,
                            error
                        );

                    }

                }

            })

            .then(() => {

                console.log(
                    "Instalación terminada:",
                    CACHE_VERSION
                );

                return self.skipWaiting();

            })

    );

});

/*
=========================================
        ACTIVACIÓN
=========================================
*/

self.addEventListener("activate", event => {

    console.log(
        "Service Worker activando:",
        CACHE_VERSION
    );

    event.waitUntil(

        caches.keys()

            .then(cacheNames => {

                return Promise.all(

                    cacheNames

                        .filter(cacheName =>

                            cacheName.startsWith(
                                "cosmetistock-"
                            )

                            &&

                            cacheName !== CACHE_VERSION

                        )

                        .map(cacheName => {

                            console.log(
                                "Eliminando caché antigua:",
                                cacheName
                            );

                            return caches.delete(
                                cacheName
                            );

                        })

                );

            })

            .then(() => {

                console.log(
                    "Caché anterior eliminada."
                );

                return self.clients.claim();

            })

    );

});

/*
=========================================
        PETICIONES
=========================================
*/

self.addEventListener("fetch", event => {

    if(event.request.method !== "GET"){

        return;

    }

    /*
    =========================================
            NETWORK FIRST
    =========================================

    Siempre intenta obtener primero
    el archivo actualizado.

    Si funciona:
        usa el archivo nuevo.

    Si falla:
        usa la caché.
    */

    event.respondWith(

        fetch(event.request)

            .then(response => {

                if(
                    response &&
                    response.ok
                ){

                    const copia =
                        response.clone();

                    caches.open(CACHE_VERSION)
                        .then(cache => {

                            cache.put(
                                event.request,
                                copia
                            );

                        })
                        .catch(error => {

                            console.warn(
                                "No se pudo actualizar la caché:",
                                error
                            );

                        });

                }

                return response;

            })

            .catch(() => {

                console.warn(
                    "Servidor no disponible. Usando caché."
                );

                return caches.match(
                    event.request
                );

            })

    );

});