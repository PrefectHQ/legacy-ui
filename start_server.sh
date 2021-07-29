#!/usr/bin/env bash

# Pipes configured environment variables into the 
# server settings.json file
if [[ -z ${PREFECT_SERVER__APOLLO_URL} ]]
then
    echo "Missing the PREFECT_SERVER__APOLLO_URL environment variable."
    exit 1
fi

if [[ -z ${PREFECT_SERVER__BASE_URL} ]]
then
    echo "Missing the PREFECT_SERVER__BASE_URL environment variable."
    exit 1
fi

echo "{\n  \"server_url\": \"$PREFECT_SERVER__APOLLO_URL\",\n  \"base_url\": \"$PREFECT_SERVER__BASE_URL\"\n}" > /var/www/settings.json

echo "👾👾👾 UI running at localhost:8080 👾👾👾"

nginx -g "daemon off;"
