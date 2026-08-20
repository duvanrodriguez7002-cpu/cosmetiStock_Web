FROM php:8.3-apache

RUN docker-php-ext-install mysqli

RUN a2enmod rewrite

# Crear el grupo utilizado por los Secret Files de Render
RUN groupadd -g 1000 rendergroup && \
    usermod -a -G rendergroup www-data

WORKDIR /var/www/html

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html