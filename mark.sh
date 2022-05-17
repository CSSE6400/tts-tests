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

function runK6 {
  name=$(basename "$1" .js)
  # enable discard body for ./load/exam-revision.js and ./load/monday-exam-block.js tests
  discard_flag=""
  if [ "$name" = "exam-revision" ] || [ "$name" = "monday-exam-block" ]; then
      discard_flag="--discard-response-bodies"
  fi
  k6 run ${discard_flag} \
    --out influxdb=http://localhost:8086/k6 \
    --out json=log-$name.json \
    --out csv=log-$name.csv $1 2>&1 | tee -a log-$name.txt
}

# if there is a third parameter
if [ $# -eq 3 ]
  then
    runK6 $3
  else
    runK6 ./api-conformance.js
    runK6 ./processing.js
    runK6 ./load/semester-break.js
    runK6 ./load/exam-revision.js
    runK6 ./load/monday-exam-block.js
    runK6 ./load/teaching-cancelled.js
    runK6 ./load/reading-list.js
    runK6 ./load/monday-in-semester.js
fi

