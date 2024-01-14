#!/usr/bin/env bash

# This script performs API calls and can operate in two modes: 'print' or 'time'.
# In 'print' mode, it prints the API call responses.
# In 'time' mode, it times how long each API call takes.

# Usage:
#   - Run in print mode (default): ./scripts/demo.sh
#   - Run in time mode: ./scripts/demo.sh time

set -eou pipefail

# source .env and .dev.vars if they exist
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
[ -f "${SCRIPT_DIR}/../.env" ] && source "${SCRIPT_DIR}/../.env"
[ -f "${SCRIPT_DIR}/../.dev.vars" ] && source "${SCRIPT_DIR}/../.dev.vars"

# Check if IS_DEMO is set
[ -z "${IS_DEMO+x}" ] && echo "IS_DEMO is not set. Exiting..." && exit 1
# [ "$IS_DEMO" != "true" ] && echo "IS_DEMO=${IS_DEMO}"

HOSTNAME=localhost
PORT=8787
API_URL="http://$HOSTNAME:$PORT/api/v1"

# Parameters
MODE=${1:-print} # Default mode is 'print'. Use 'time' for timing tests.

# Function to print header
function print_header() {
  printf "\n%-50s %10s\n" "Endpoint" "Time (ms)"
  printf "%-50s %10s\n" "--------------------------------------------------" "----------"
}

# Helper function to calculate average time
function calculate_average_time() {
  local times=("$@")
  local num_times=${#times[@]}
  local sum=0

  for ((i=0; i<num_times; i++)); do
    sum=$(($sum + ${times[i]}))
  done

  local avg_time=$(($sum / $num_times))

  echo $avg_time
}

# Helper function to time API calls and calculate average time
function time_api_calls() {
  local path_curl=$1
  local timeout=30
  local call_times=()
  local num_calls=3

  for ((j=0; j<num_calls; j++)); do
    start_time=$(date +%s%3N)

    # Use curl to fetch the response and HTTP status code
    response=$(curl --silent --max-time $timeout --write-out "HTTPSTATUS:%{http_code}" -X GET "$API_URL$path_curl")
    end_time=$(date +%s%3N)

    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

    # Check for HTTP status code outside the 200-299 range
    if [[ $http_status -lt 200 || $http_status -gt 299 ]]; then
      echo "Error on API call to $API_URL$path_curl:"
      echo $response_body | jq
      exit 1
    fi

    call_times+=($(($end_time - $start_time)))
  done

  local avg_time=$(calculate_average_time "${call_times[@]}")
  printf "%-50s %7d ms (avg)\n" "$path_curl" $avg_time
}

# Function to time and curl endpoints
function curl_endpoint() {
  local _mode=$1
  local path_display=$2
  local path_curl=$3

  if [ "$_mode" == "time" ]; then
    time_api_calls "$path_curl"
  elif [ "$_mode" == "print" ]; then
    YELLOW_BOLD='\033[1;33m'
    CYAN_BOLD='\033[1;36m'
    ENDC='\033[0m'
    echo -e "${YELLOW_BOLD}================$ENDC $CYAN_BOLD/api/v1$path_display$ENDC ${YELLOW_BOLD}=================$ENDC"
    echo

    # Actual curl command with output
    (set -x;
    curl --silent "$API_URL$path_curl" | jq)
  fi
}

if [ "$MODE" == "time" ]; then
  curl --silent "$API_URL/debug/total-supply" | jq
  curl --silent "$API_URL/debug/num-list-ops" | jq
  curl --silent "$API_URL/debug/num-events" | jq
  print_header
fi

# Array of API paths
paths=(
  '/debug/total-supply' '/debug/total-supply'
  '/debug/num-list-ops' '/debug/num-list-ops'
  '/debug/num-events' '/debug/num-events'

  '/users/:id/ens' '/users/dr3a.eth/ens'
  '/users/:id/primary-list' '/users/dr3a.eth/primary-list'
  '/users/:id/following' '/users/dr3a.eth/following'
  '/users/:id/followers' '/users/dr3a.eth/followers'
  '/users/:id/stats' '/users/dr3a.eth/stats'

  '/lists/:token_id/records?includeTags=:includeTags' '/lists/0/records?includeTags=false'
  '/lists/:token_id/records?includeTags=:includeTags' '/lists/0/records?includeTags=true'

  '/leaderboard/blocked?limit=:limit' '/leaderboard/blocked?limit=10'
  '/leaderboard/blocks?limit=:limit' '/leaderboard/blocks?limit=10'
  '/leaderboard/muted?limit=:limit' '/leaderboard/muted?limit=10'
  '/leaderboard/mutes?limit=:limit' '/leaderboard/mutes?limit=10'
  '/leaderboard/followers?limit=:limit' '/leaderboard/followers?limit=10'
  '/leaderboard/following?limit=:limit' '/leaderboard/following?limit=10'
)

# Loop over paths and call the curl_endpoint function
for ((i=0; i<${#paths[@]}; i+=2)); do
  path_display=${paths[i]}
  path_curl=${paths[i+1]}
  curl_endpoint "$MODE" "$path_display" "$path_curl"
done

echo
