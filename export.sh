#!/bin/sh

cat .salesforce_env_dev | while read line; do
    echo $line
    export $line
done