#!/bin/sh

echo $VUE_APP_RELEASE_TIMESTAMP

touch .env
echo "" >> .env

cat ".salesforce_env_${VUE_APP_ENVIRONMENT}" | while read line; do
    echo $line
    echo $line >> .env
done