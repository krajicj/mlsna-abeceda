FROM node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436 AS toolchain
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Bake the pinned pnpm into the image so every service runs without network access.
RUN corepack enable \
 && corepack install -g pnpm@11.20.0 \
 && chmod -R a+rX /opt/corepack
ENV COREPACK_ENABLE_NETWORK=0
USER node
WORKDIR /app

# Only the voice services need ffmpeg: it measures the loudness of a generated clip and re-gains it
# (scripts/generate-voice.mjs --normalize). A Debian package from the pinned base image, no npm and
# no install scripts; its own stage keeps the dev/test/build image small.
FROM toolchain AS media
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*
USER node
WORKDIR /app
