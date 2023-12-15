#!/usr/bin/env bash

function sendHeadRequest() {
    local host=$1
    local port=$2
    local endpoint="http://$host:$port/health"

    echo
    echo "========================================"
    echo "Querying: $endpoint"
    echo "========================================"

    (set -x; curl $endpoint --GET \
      --connect-timeout 3 \
      --silent \
      --show-error && set +x)
      if [ $? -eq 0 ]; then
        # green success message
        echo -e "\n\033[0;32m$endpoint connection succeeded\033[0m"
      else
        # red error message
        echo -e "\n\033[0;31m$endpoint Failed to connect\033[0m"
      fi
    echo
}

echo "Ping starting..."

# List of hosts to query
hosts=("localhost" "0.0.0.0" "127.0.0.1" "host.docker.internal")

PORT=${PORT:-8787}


for host in "${hosts[@]}"; do
  sendHeadRequest $host $PORT
done


echo "Ping finished."
