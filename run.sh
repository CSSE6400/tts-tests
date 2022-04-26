#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "usage: ./run.sh [endpoint]";
    exit 1;
fi

export ENDPOINT=$1

k6 run ./functionality.js
