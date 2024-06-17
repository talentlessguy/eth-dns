# SwarmSummit ETH<->DNS demo

## Run

### `vitalik.eth:8080`

Deno 1.44+ is required.

```
deno run --allow-net --unstable-net dns.ts
```

### `https://vitalik.eth`

A reverse proxy (such as Caddy) is required.

Run as

```
sudo caddy run --config Caddyfile
```
