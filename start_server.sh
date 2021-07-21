#!/usr/bin/env bash

# Pipes configured environment variables into the 
# server settings.json file
if [[ -z PREFECT_SERVER__APOLLO_URL || -z PREFECT_SERVER__BASE_URL ]]; then echo "missing PREFECT_SERVER__APOLLO_URL or PREFECT_SERVER__BASE_URL" && exit 1
echo "{\n  \"server_url\": \"$PREFECT_SERVER__APOLLO_URL\",\n  \"base_url\": \"$PREFECT_SERVER__BASE_URL\"\n}" > /var/www/settings.json

echo "👾👾👾 UI running at localhost:8080 👾👾👾"

nginx -g "daemon off;"
