#!/bin/sh

touch .env
echo "" >> .env

cat ".salesforce_env_${VUE_APP_ENVIRONMENT}" | while read line; do
    echo $line >> .env
done