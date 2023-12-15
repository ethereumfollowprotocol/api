# syntax=docker/dockerfile:1
FROM oven/bun:latest as setup

WORKDIR /usr/src/app

COPY bun.lockb package.json ./

RUN bun install --production --frozen-lockfile

COPY . .
