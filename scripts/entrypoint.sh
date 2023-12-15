#!/usr/bin/env bash

set -eoux pipefail

cat <<EOF > .dev.vars

ENV="development"
NODE_ENV="development"
PORT=8787
DATABASE_URL="postgresql://postgres:postgres@efp-database:5432/efp?sslmode=disable"

EOF

exec "$@"
