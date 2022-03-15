#!/bin/sh

echo $VUE_APP_RELEASE_TIMESTAMP
touch .env

cat .salesforce_env_dev | while read line; do
    echo $line >> .env
done