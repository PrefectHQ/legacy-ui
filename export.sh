#!/bin/sh

echo $VUE_APP_RELEASE_TIMESTAMP

cat .salesforce_env_dev | while read line; do
    echo $line
    export $line
done