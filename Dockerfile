FROM php:8.3-apache

RUN docker-php-ext-install mysqli

RUN a2enmod rewrite

WORKDIR /var/www/html

COPY . /var/www/html/

RUN echo "DirectoryIndex index.html index.php" > /etc/apache2/mods-enabled/dir.conf

RUN chown -R www-data:www-data /var/www/html