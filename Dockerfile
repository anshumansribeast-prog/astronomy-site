# ===================================================================
# Dockerfile — the recipe for building the astronomy site into an image.
#
# This used to be nginx serving plain files — accurate right up until
# real accounts needed a server to actually check a password against.
# Now the same site is served BY that server (server/app.js), which
# hands out the static files itself and answers /api/auth/* — one
# process doing both jobs, same as cosmos-v2's Dockerfile does it, and
# for the same reason: node:sqlite + node:crypto are built into Node,
# so this still needs zero npm installs despite gaining a real backend.
#
# Build it:  docker build -t astronomy-site .
# Run it:    docker run -p 8899:8899 -v astronomy-data:/data astronomy-site
# ===================================================================

FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8899

# Where the account/session database lives. A container's own
# filesystem is thrown away on restart — anything that must survive
# has to live on a mounted volume, attached at a path given through an
# environment variable so nothing in the code has to know it in advance.
ENV ASTRO_DATA_DIR=/data

# No dependencies to install (package.json declares none), so there's
# no separate install-then-copy step to cache — just copy the source.
COPY --chown=node:node package.json ./
COPY --chown=node:node server ./server
COPY --chown=node:node *.html ./
COPY --chown=node:node css ./css
COPY --chown=node:node js ./js

# Must exist and be writable before the process drops root — a
# non-root user can't create a folder at the filesystem root itself.
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]

# Don't run as root — the `node` base image ships a `node` user for
# exactly this, and using it removes a whole class of "how bad could
# it get" if a hole is ever found in the server.
USER node

EXPOSE 8899

# A process that's running isn't the same as a server that's working —
# ask it the way a visitor's browser would, through the real route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8899)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form, not shell form — this makes Node process 1 so it receives
# SIGTERM directly. In shell form Node would be a child of /bin/sh,
# which doesn't forward signals, and the clean shutdown in index.js
# would never fire on a redeploy.
CMD ["node", "server/index.js"]
