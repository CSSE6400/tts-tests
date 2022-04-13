#!/bin/bash

export ENDPOINT=http://chatterbox-gamma-lb-969422561.us-east-1.elb.amazonaws.com

# export SAMPLE_ID=$(curl -X POST \
#  -H "Accept: application/json" \
#  -H "Content-Type: application/json" \
#  "${ENDPOINT}" \
#  -d '{
#   "message" : "Hello, CSSE6400!",
#   "operation" : "SYNC"
# }') | jq '.id'

export SAMPLE_ID=1

if [[ "${SAMPLE_ID}" -eq "undefined" ]]; then
  echo "Error: Sample ID is undefined"
  exit 1
fi

k6 run scenarios/semester-break.js
