#!/bin/bash
# One-time bootstrap for the Let's Encrypt certificate. Run this ONCE on the
# server after the first `docker compose up`, before HTTPS can work:
#
#   cd IICNITDGP_Website
#   ./nginx/init-letsencrypt.sh
#
# After this succeeds, the `certbot` service in docker-compose.yml keeps the
# certificate renewed automatically — you never need to run this again unless
# the certbot-etc volume is deleted.

set -e

cd "$(dirname "$0")/.."

domain="iic.nitdgp.ac.in"
email="your-email@example.com" # TODO: set a real address you monitor for renewal/expiry notices
compose="docker compose --env-file .env.docker"

if [ "$email" = "iifnitdgp@gmail.com" ]; then
  echo "Edit nginx/init-letsencrypt.sh and set a real email address before running this." >&2
  exit 1
fi

echo "### Creating a dummy certificate so nginx can start ..."
$compose run --rm --entrypoint sh certbot -c "
  mkdir -p /etc/letsencrypt/live/$domain &&
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$domain/privkey.pem \
    -out /etc/letsencrypt/live/$domain/fullchain.pem \
    -subj '/CN=localhost'
"

echo "### Starting nginx with the dummy certificate ..."
$compose up -d --build nginx

echo "### Deleting the dummy certificate ..."
$compose run --rm --entrypoint sh certbot -c "rm -rf /etc/letsencrypt/live/$domain"

echo "### Requesting the real Let's Encrypt certificate for $domain ..."
$compose run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  --email "$email" -d "$domain" \
  --rsa-key-size 2048 --agree-tos --non-interactive

echo "### Reloading nginx with the real certificate ..."
$compose exec nginx nginx -s reload

echo "Done. https://$domain should now be serving a valid certificate."
