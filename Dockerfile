FROM php:apache

ENV PORT ${HTTP_PORT:-8080}

RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng12-dev \
        wget \
        zip \
        unzip; \
    # We install and enable php-gd
    docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/; \
    docker-php-ext-install -j$(nproc) gd; \

    # We enable Apache's mod_rewrite
    a2enmod rewrite
    sed -i "s/80/${PORT}/g" /etc/apache2/ports.conf

EXPOSE $PORT

COPY . .
