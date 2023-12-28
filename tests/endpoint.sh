#!/usr/bin/env bash

#
# A dead simple script to test the endpoints of the API for 200 status code.
#

set -eou pipefail allexport

# source .env and .dev.vars if they exist
[ -f .env ] && source .env
[ -f .dev.vars ] && source .dev.vars

VERBOSE="${VERBOSE:-false}"
IS_DEMO="${IS_DEMO:-false}"
API_URL="${API_URL:-http://localhost:8787/api/v1}"

echo "Running endpoints test against $API_URL..."
echo "Demo mode: $IS_DEMO"
echo "Verbose logging: $VERBOSE"
echo

TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")

if ! curl --silent --fail http://localhost:8787 >/dev/null; then
  echo "http://localhost:8787 is not running. Exiting..." && exit 1
fi

paths=(
  '/users/dr3a.eth/ens'
  '/users/dr3a.eth/stats'
  '/users/dr3a.eth/primary-list'
  '/users/0xC480C3FD10d8965EB74B9B53ee65Bea24B2a6A73/primary-list'
  '/users/dr3a.eth/following'
  '/users/dr3a.eth/following/tagged/efp'
  '/users/dr3a.eth/following/tagged/ens'
  '/users/dr3a.eth/following/tagged/block'
  '/users/dr3a.eth/following/tagged/mute'
  '/users/dr3a.eth/following/tags'
  '/users/dr3a.eth/followers'
  '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whoblocks'
  '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whomutes'
  '/leaderboard/followers?limit=3'
  '/leaderboard/following?limit=3'
  '/lists/0/records?includeTags=false'
  '/lists/0/records?includeTags=true'
)

function request() {
  curl --head \
    --request 'GET' \
    --silent \
    --fail \
    --write-out '%{http_code}%{errormsg}' \
    --url "$API_URL$1" \
    --output /dev/null \
    --connect-timeout 3 \
    --max-time 4
}

TEMP_FAILED_RESULTS_FILE=$(mktemp)
echo "$TIMESTAMP $API_URL" > "$TEMP_FAILED_RESULTS_FILE"

# for each path, make a request and save the result (save status code and error message if any)
for path in "${paths[@]}"; do
  response=$(request "$path" || true)
  status_code=$(echo $response | cut -c1-3)
  error_message=$(echo $response | cut -c4-)
  if [[ "$VERBOSE" == "true" && "$status_code" == "200" ]]; then
    echo "✔︎ $status_code $path"
  fi
  if [ "$status_code" != "200" ]; then
    echo "$status_code $path $error_message" >>"$TEMP_FAILED_RESULTS_FILE"
  fi
done

echo "Results filepath: $(dirname "$TEMP_FAILED_RESULTS_FILE")/$(basename "$TEMP_FAILED_RESULTS_FILE")"
# if there are any failed results, print them and exit with error
if [ -s "$TEMP_FAILED_RESULTS_FILE" ]; then
  echo "Failed results:"
  cat "$TEMP_FAILED_RESULTS_FILE"
  exit 1
fi


