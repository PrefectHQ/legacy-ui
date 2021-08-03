#!/usr/bin/env bash

# Set default prefect_ui_settings if
# env vars not present
if [[ -z ${PREFECT_SERVER__APOLLO_URL} ]]
then
    echo "Missing the PREFECT_SERVER__APOLLO_URL environment variable.  Using default"
    PREFECT_SERVER__APOLLO_URL="http://localhost:4200/graphql"
fi

if [[ -z ${PREFECT_SERVER__BASE_URL} ]]
then
    echo "Missing the PREFECT_SERVER__BASE_URL environment variable.  Using default"
    PREFECT_SERVER__BASE_URL="/"
fi

sed -i "s,PREFECT_SERVER__APOLLO_URL,$PREFECT_SERVER__APOLLO_URL," /var/www/settings.json 
sed -i "s,PREFECT_SERVER__BASE_URL,$PREFECT_SERVER__BASE_URL," /var/www/settings.json

echo "👾👾👾 UI running at localhost:8080 👾👾👾"

nginx -g "daemon off;"
