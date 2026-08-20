FROM php:8.3-apache

RUN docker-php-ext-install mysqli

RUN a2enmod rewrite

RUN groupadd -g 1000 rendergroup && \
    usermod -a -G rendergroup www-data

ENV TZ=America/Bogota

RUN echo "date.timezone=America/Bogota" > /usr/local/etc/php/conf.d/timezone.ini

WORKDIR /var/www/html

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html