FROM node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Bake the pinned pnpm into the image so every service runs without network access.
RUN corepack enable \
 && corepack install -g pnpm@11.20.0 \
 && chmod -R a+rX /opt/corepack
ENV COREPACK_ENABLE_NETWORK=0
USER node
WORKDIR /app
