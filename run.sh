#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "usage: ./run.sh [endpoint]";
    exit 1;
fi

export ENDPOINT=$1
# if -l flag is set, then log to influxdb
if [ "$2" = "-l" ]
  then
      export K6_OUT=influxdb=http://localhost:8086/k6
fi


k6 run ./api-conformance.js
k6 run ./processing.js
