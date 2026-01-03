FROM node:22-slim

# Install Python and uv
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3.12-venv \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh

ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

EXPOSE 5173 8123

# Code is mounted via docker-compose, not copied
CMD ["npm", "run", "dev:start"]
