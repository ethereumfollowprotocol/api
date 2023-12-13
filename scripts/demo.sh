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
  echo -e "${YELLOW_BOLD}================$ENDC $CYAN_BOLD/v1/$1$ENDC ${YELLOW_BOLD}=================$ENDC"

  echo
  (set -x; curl -s "http://localhost:8787/v1/$2") | jq
  echo
  echo
}

curl_endpoint 'ens/:id' 'ens/dr3a.eth'
curl_endpoint 'stats/:id' 'efp/stats/dr3a.eth'
curl_endpoint 'primaryList/:id' 'efp/primaryList/dr3a.eth'
curl_endpoint 'followingCount/:id' 'efp/followingCount/dr3a.eth'
curl_endpoint 'following/:id' 'efp/following/dr3a.eth'
curl_endpoint 'following/:id/:tag' 'efp/following/dr3a.eth/efp'
curl_endpoint 'followingWithTags/:id' 'efp/followingWithTags/dr3a.eth'
curl_endpoint 'followersCount/:id' 'efp/followersCount/dr3a.eth'
curl_endpoint 'followers/:id' 'efp/followers/dr3a.eth'
curl_endpoint 'whoblocks/:id' 'efp/whoblocks/0x86A41524CB61edd8B115A72Ad9735F8068996688'
curl_endpoint 'whomutes/:id' 'efp/whomutes/0x86A41524CB61edd8B115A72Ad9735F8068996688'
