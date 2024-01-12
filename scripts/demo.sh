#!/usr/bin/env bash

# This script performs API calls and can operate in two modes: 'print' or 'time'.
# In 'print' mode, it prints the API call responses.
# In 'time' mode, it times how long each API call takes.

# Usage:
#   - Run in print mode (default): ./script.sh
#   - Run in time mode: ./script.sh time

set -eou pipefail

# source .env and .dev.vars if they exist
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
[ -f "${SCRIPT_DIR}/../.env" ] && source "${SCRIPT_DIR}/../.env"
[ -f "${SCRIPT_DIR}/../.dev.vars" ] && source "${SCRIPT_DIR}/../.dev.vars"

# Check if IS_DEMO is set
[ -z "${IS_DEMO+x}" ] && echo "IS_DEMO is not set. Exiting..." && exit 1
[ "$IS_DEMO" != "true" ] && echo "IS_DEMO=${IS_DEMO}"

# Parameters
MODE=${1:-print} # Default mode is 'print'. Use 'time' for timing tests.
# Function to print header
function print_header() {
  printf "\n%-50s %10s\n" "Endpoint" "Time (ms)"
  printf "%-50s %10s\n" "--------------------------------------------------" "----------"
}

# Function to time and curl endpoints
function curl_endpoint() {
  local path_display=$1
  local path_curl=$2
  local start_time end_time

  if [ "$MODE" == "time" ]; then
    start_time=$(date +%s%3N) # Milliseconds
    curl --silent "http://localhost:8787/api/v1$path_curl" > /dev/null 2>&1
    end_time=$(date +%s%3N)
    printf "%-50s %7d ms\n" "$path_curl" $(($end_time - $start_time))
  elif [ "$MODE" == "print" ]; then
    YELLOW_BOLD='\033[1;33m'
    CYAN_BOLD='\033[1;36m'
    ENDC='\033[0m'
    echo -e "${YELLOW_BOLD}================$ENDC $CYAN_BOLD/api/v1$path_display$ENDC ${YELLOW_BOLD}=================$ENDC"
    echo

    # Actual curl command with output
    (set -x;
    curl --silent "http://localhost:8787/api/v1$path_curl" | jq)
  fi
}

if [ "$MODE" == "time" ]; then
  print_header
fi

# Array of API paths
paths=(
  '/lists/:token_id/records?includeTags=:includeTags' '/lists/0/records?includeTags=false'
  '/lists/:token_id/records?includeTags=:includeTags' '/lists/0/records?includeTags=true'

  '/users/:id/ens' '/users/dr3a.eth/ens'
  '/users/:id/primary-list' '/users/dr3a.eth/primary-list'
  # '/users/:id/primary-list' '/users/0xC480C3FD10d8965EB74B9B53ee65Bea24B2a6A73/primary-list'
  '/users/:id/following' '/users/dr3a.eth/following'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/efp'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/ens'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/block'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/mute'
  # '/users/:id/following/tags' '/users/dr3a.eth/following/tags'
  '/users/:id/followers' '/users/dr3a.eth/followers'
  # '/users/:id/whoblocks' '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whoblocks'
  # '/users/:id/whomutes' '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whomutes'
  '/users/:id/stats' '/users/dr3a.eth/stats'

  '/leaderboard/followers?limit=:limit' '/leaderboard/followers?limit=3'
  '/leaderboard/following?limit=:limit' '/leaderboard/following?limit=3'
  '/leaderboard/blocked?limit=:limit' '/leaderboard/blocked?limit=3'
  '/leaderboard/blocks?limit=:limit' '/leaderboard/blocks?limit=3'
  '/leaderboard/muted?limit=:limit' '/leaderboard/muted?limit=3'
  '/leaderboard/mutes?limit=:limit' '/leaderboard/mutes?limit=3'
)

# Loop over paths and call the curl_endpoint function
for ((i=0; i<${#paths[@]}; i+=2)); do
  path_display=${paths[i]}
  path_curl=${paths[i+1]}
  curl_endpoint "$path_display" "$path_curl"
done
