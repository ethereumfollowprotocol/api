#!/usr/bin/env bash

set -e;

echo ==============================================
echo "                   Demo"
echo ==============================================
echo
echo
echo

function curl_endpoint() {
  YELLOW_BOLD='\033[1;33m'
  CYAN_BOLD='\033[1;36m'
  ENDC='\033[0m'
  echo -e "${YELLOW_BOLD}================$ENDC $CYAN_BOLD/api/v1$1$ENDC ${YELLOW_BOLD}=================$ENDC"

  echo
  (set -x; curl -s "http://localhost:8787/api/v1$2") | jq
  echo
  echo
}

curl_endpoint '/users/:id/ens' '/users/dr3a.eth/ens'
curl_endpoint '/users/:id/stats' '/users/dr3a.eth/stats'
curl_endpoint '/users/:id/primary-list' '/users/dr3a.eth/primary-list'
# curl_endpoint '/users/:id/primary-list' '/users/0xC480C3FD10d8965EB74B9B53ee65Bea24B2a6A73/primary-list'
curl_endpoint '/users/:id/following' '/users/dr3a.eth/following'
# curl_endpoint '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/efp'
# curl_endpoint '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/ens'
# curl_endpoint '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/block'
# curl_endpoint '/users/:id/following/tagged/:tag' '/users/dr3a.eth/following/tagged/mute'
curl_endpoint '/users/:id/following/tags' '/users/dr3a.eth/following/tags'
curl_endpoint '/users/:id/followers' '/users/dr3a.eth/followers'
# curl_endpoint '/users/:id/whoblocks' '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whoblocks'
# curl_endpoint '/users/:id/whomutes' '/users/0x86A41524CB61edd8B115A72Ad9735F8068996688/whomutes'
curl_endpoint '/users/top-followed?n=3' '/users/top-followed?n=3'
curl_endpoint '/users/top-following?n=3' '/users/top-following?n=3'
