#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "usage: ./run.sh [endpoint] [-l] [test]";
    exit 1;
fi

export ENDPOINT=$1
# if -l flag is set, then log to influxdb
if [ "$2" = "-l" ]
  then
      export K6_OUT="influxdb=http://localhost:8086/k6"
fi

response=$(curl --write-out '%{http_code}' --silent --output /dev/null ${ENDPOINT}/health)
# exit if health endpoint is not 200
if [ "$response" != "200" ]
  then
    echo "Health endpoint is not 200";
    exit 1;
fi

# if there is a third parameter
if [ $# -eq 3 ]
  then
    name=$(basename "$3" .js)
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log-$name.json --out csv=log-$name.csv $3 2>&1 | tee -a log-$name.txt
  else
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./api-conformance.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./processing.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./load/semester-break.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./load/exam-revision.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./load/monday-exam-block.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./load/teaching-cancelled.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./load/reading-list.js 2>&1 | tee -a log.txt
    k6 run --out influxdb=http://localhost:8086/k6 --out json=log.json --out csv=log.csv ./load/monday-in-semester.js 2>&1 | tee -a log.txt
fi

