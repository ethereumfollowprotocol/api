> [!NOTE]
> **Ethereum Follow Protocol** is in active development.

<p align="center">
  <a href="https://ethfollow.xyz" target="_blank" rel="noopener noreferrer">
    <img width="275" src="https://docs.ethfollow.xyz/logo.png" alt="EFP logo" />
  </a>
</p>
<br />
<p align="center">
  <a href="https://pr.new/ethereumfollowprotocol/api"><img src="https://developer.stackblitz.com/img/start_pr_dark_small.svg" alt="Start new PR in StackBlitz Codeflow" /></a>
  <a href="https://discord.ethfollow.xyz"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat" /></a>
  <a href="https://x.com/ethfollowpr"><img src="https://img.shields.io/twitter/follow/ethfollowpr?label=%40ethfollowpr&style=social&link=https%3A%2F%2Fx.com%2Fethfollowpr" alt="x account" /></a>
</p>

<h1 align="center" style="font-size: 2.75rem; font-weight: 900; color: white;">Ethereum Follow Protocol API</h1>

> A native Ethereum protocol for following and tagging Ethereum accounts.

## Important links

- Documentation: [**docs.ethfollow.xyz/api**](https://docs.ethfollow.xyz/api)

## Getting started with development

### Prerequisites

- [Bun runtime](https://bun.sh/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Ethereum Follow Protocol Indexer](https://github.com/ethereumfollowprotocol/indexer)
  - [Supabase Postgres Database](https://supabase.com/dashboard/new?plan=free)


The API relies on a postgres database whose data is populated by the indexer.
The database is hosted on [Supabase](https://supabase.com/dashboard/new?plan=free).
Supabase offers a free database with unlimited API requests and up to 5GB of bandwidth so it's a great option for development.
Howver, in the near future you will be able to use any postgres database.


### Setup

Assuming you have an indexer running and postgres database setup on Supabase, follow these steps to get started with development:

0. Ensure development tools are up to date

    ```bash
    bun upgrade
    ```
    ```bash
    bun add --global wrangler@latest
    ```

1. Clone the repository (I'm using [**cli.github.com**](https://cli.github.com))

    ```bash
    gh repo clone ethereumfollowprotocol/api
    ```

2. Install dependencies

    ```bash
    bun install
    ```

4. Setup environment variables

    ```bash
    cp .dev.vars.example .dev.vars
    ```
    > [!NOTE]
    > `.dev.vars` is Cloudflare Workers' equivalent of `.env` ([learn more](https://developers.cloudflare.com/workers/configuration/environment-variables/#interact-with-environment-variables-locally)).
    > Check `.dev.vars` for required variables and how to get them.

5. Start development server and make requests

    ```bash
    bun dev
    ```
    Make a request to the health endpoint to check if server is running
    ```bash
    curl 'http://localhost:8787/v1/health'   
    # should return 'ok'
    ```
    Make a request to the postgres health endpoint to check if the database is connected
    ```bash
    curl 'http://localhost:8787/v1/postgres-health'
    # should return 'ok'
    ```

____
TODO: Continue documentation
____

<br />

Follow [**@ethfollowpr**](https://x.com/ethfollowpr) on **𝕏** for updates and join the [**Discord**](https://discord.ethfollow.xyz) to get involved.
 