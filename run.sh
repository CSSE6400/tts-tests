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

response=$(curl --write-out '%{http_code}' --silent --output /dev/null ${ENDPOINT}/health)
# exit if health endpoint is not 200
if [ "$response" != "200" ]
  then
    echo "Health endpoint is not 200";
    exit 1;
fi


k6 run ./api-conformance.js
k6 run ./processing.js
k6 run ./load/semester-break.js
k6 run ./load/exam-revision.js
k6 run ./load/monday-exam-block.js
k6 run ./load/teaching-cancelled.js
k6 run ./load/reading-list.js
k6 run ./load/monday-in-semester.js

