# Deployment


## Prerequisites

- Docker and Docker Compose on the server
- Traefik running with the `web` network
- Git access to the repository

###

Setup Traefik

## Inital setup

- In `docker-compose.prod.yml`  Replace todo.rax0.de with our own domain and everything with todo in the labels. Also replace the `BETTERAUTH_SECRET_KEY` with a own random one
- Update username and password in `scripts/ssh.sh` and `scripts/deploy.sh`
- Go on the server and clone your repo in `~/poject-name`
- Create a root user


## Deploy Steps

### Quick deploy (recommended)

```bash
git push && ./scripts/deploy.sh
```

### Manual steps

<details>
<summary>Click to expand</summary>

#### 1. Push code (local)

```bash
git add -A && git commit -m "your changes" && git push
```

#### 2. Pull on server

```bash
ssh your-server
cd /path/to/library
git pull
```

#### 3. Build the React app

```bash
docker compose -f docker-compose.prod.yml run --rm build
```

#### 4. Run database migrations (if schema changed)

```bash
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml run --rm migrate
```

#### 5. Start the app

```bash
docker compose -f docker-compose.prod.yml up -d
```

</details>

This starts:
- **APP**: Production React server (port 5173)
- **WORKER**: Background job processor
- **PY**: Python API service (port 8123)

## Rebuild Docker image

Required when you change:
- `Dockerfile`
- System dependencies (apt packages)
- Node.js or Python version

```bash
# Stop running containers
docker compose -f docker-compose.prod.yml down

# Rebuild image
docker compose -f docker-compose.prod.yml build --no-cache

# Start fresh
docker compose -f docker-compose.prod.yml up -d
```

## View logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

## Restart

```bash
docker compose -f docker-compose.prod.yml restart app
```
