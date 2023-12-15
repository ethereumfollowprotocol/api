# syntax=docker/dockerfile:1
FROM oven/bun:latest

WORKDIR /usr/src/app

RUN apt-get update --yes \
  && apt-get clean autoclean \
  && apt-get autoremove --yes \
  && rm -rf /var/lib/{apt,dpkg,cache,log}/

COPY bun.lockb package.json ./

RUN bun install --frozen-lockfile

COPY . .

CMD [ "bun", "--hot", "--watch", "./src/index.ts" ]
