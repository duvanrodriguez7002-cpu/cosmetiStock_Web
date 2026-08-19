FROM php:8.3-apache

# /* Instala la extensión mysqli para permitir que PHP se comunique con MySQL. */
RUN docker-php-ext-install mysqli

# /* Habilita el módulo rewrite de Apache para permitir futuras rutas y configuraciones. */
RUN a2enmod rewrite

# /* Define la carpeta donde Apache buscará nuestra aplicación. */
WORKDIR /var/www/html