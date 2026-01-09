FROM node:22-bookworm-slim

#############################################
# COMMON LAYER - shared across projects
#############################################

# Core dev tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    make

# Install uv for Python
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Python environment config
ENV UV_CACHE_DIR=/cache/uv
ENV UV_LINK_MODE=copy

# Global npm tools
RUN npm i -g concurrently

#############################################
# APP LAYER - library-specific dependencies
#############################################

# PDF/Image processing (poppler, weasyprint)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpoppler-dev \
    poppler-utils \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
EXPOSE 5173 8123
