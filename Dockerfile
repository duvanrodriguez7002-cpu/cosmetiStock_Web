FROM php:8.3-apache

RUN docker-php-ext-install mysqli

RUN a2enmod rewrite

# Permitir que Apache/PHP pueda leer los Secret Files de Render
RUN usermod -a -G 1000 www-data

WORKDIR /var/www/html

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html