#!/usr/bin/env bash

# Pipes configured environment variables into the 
# server settings.json file
jq -n '{server_url: env.PREFECT_SERVER__APOLLO_URL, base_url: env.PREFECT_SERVER__BASE_URL}' > /var/www/settings.json

echo "👾👾👾 UI running at localhost:8080 👾👾👾"

nginx -g "daemon off;"
