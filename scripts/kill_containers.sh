#!/bin/bash

# Get list of running container IDs
# 'ps' lists containers, '-q' returns only the numeric IDs
ids=$(docker ps -q)

if [ -z "$ids" ]; then
    exit 0
fi

docker kill $ids