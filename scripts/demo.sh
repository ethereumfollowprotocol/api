#!/usr/bin/env bash

set -eou pipefail allexport

# source .env and .dev.vars if they exist
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"


[ -f "${SCRIPT_DIR}/../.env" ] && source "${SCRIPT_DIR}/../.env"
[ -f "${SCRIPT_DIR}/../.dev.vars" ] && source "${SCRIPT_DIR}/../.dev.vars"

[ -z "${IS_DEMO+x}" ] && echo "IS_DEMO is not set. Exiting..." && exit 1

[ "$IS_DEMO" != "true" ] && echo "IS_DEMO=${IS_DEMO}"

echo
echo ==============================================
echo "                   Demo"
echo ==============================================
echo
echo

if ! curl --silent --fail http://localhost:8787 >/dev/null; then
  echo "http://localhost:8787 is not running. Exiting..." && exit 1
fi

function curl_endpoint() {
  YELLOW_BOLD='\033[1;33m'
  CYAN_BOLD='\033[1;36m'
  ENDC='\033[0m'
  echo -e "${YELLOW_BOLD}================$ENDC $CYAN_BOLD/api/v1$1$ENDC ${YELLOW_BOLD}=================$ENDC"

  echo
  (
    set -x
    curl --silent "http://localhost:8787/api/v1$2"
  ) | jq
  echo
  echo
}

paths=(
  '/users/:id/ens' '/users/dr3a.eth/ens'
  '/users/:id/stats' '/users/dr3a.eth/stats'
  '/users/:id/primary-list' '/users/dr3a.eth/primary-list'
  # '/users/:id/primary-list' '/users/0xC480C3FD10d8965EB74B9B53ee65Bea24B2a6A73/primary-list'
  '/users/:id/folowing' '/users/dr3a.eth/following'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/efp'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/ens'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/block'
  # '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/mute'
  # '/users/:id/following/tags' '/users/dr3a.eth/following/tags'
  '/users/:id/followers' '/users/dr3a.eth/followers'
  # '/users/:id/whoblocks' '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whoblocks'
  # '/users/:id/whomutes' '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whomutes'
  '/leaderboard/followers?limit=:limit' '/leaderboard/followers?limit=3'
  '/leaderboard/following?limit=:limit' '/leaderboard/following?limit=3'
  '/lists/:token_id/records?includeTags=:includeTags' '/lists/0/records?includeTags=false'
  '/lists/:token_id/records?includeTags=:includeTags' '/lists/0/records?includeTags=true'
)

for ((i=0; i<${#paths[@]}; i+=2)); do
  path1=${paths[i]}
  path2=${paths[i+1]}
  curl_endpoint "$path1" "$path2"
done
