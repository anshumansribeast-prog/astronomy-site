# ===================================================================
# Dockerfile — the recipe for building the astronomy site into an image.
#
# This site is plain HTML/CSS/JS with no build step and no server code
# of its own — the only job a container has to do is hand out files.
# nginx is the standard tool for exactly that: small, fast, and it has
# already been solving "serve a folder of static files well" longer
# than most alternatives have existed.
#
# Build it:  docker build -t astronomy-site .
# Run it:    docker run -p 8080:8080 astronomy-site
# ===================================================================

# PIN THE VERSION. Not `nginx:latest` — see cosmos-v2's Dockerfile for
# why an unpinned tag makes a build silently different next month.
# Alpine again, for the same reason: smaller image, faster pull.
FROM nginx:1.27-alpine

# The port nginx listens on. nginx.conf.template reads this at
# container start (see that file for how); this just states the
# default so a reader does not have to go looking for it.
ENV PORT=8080

# The template that becomes the real nginx config. Files placed in
# /etc/nginx/templates/*.template are run through envsubst by the base
# image's own startup script before nginx ever reads them — nothing
# extra to install for that to work.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# THE SITE ITSELF.
#
# Everything nginx serves lives under /usr/share/nginx/html by
# convention in this image. Named explicitly rather than `COPY . .` —
# this is the recipe's own build context too (Dockerfile, this
# template), and neither of those is a page anyone should be able to
# request.
WORKDIR /usr/share/nginx/html
COPY *.html ./
COPY css ./css
COPY js ./js

# Documentation, not a firewall rule — see cosmos-v2's Dockerfile for
# why EXPOSE alone publishes nothing.
EXPOSE 8080

# IS IT ACTUALLY ALIVE? A container that started is not the same as a
# server that answers — ask it the way a visitor would.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1

# The nginx base image's own CMD already runs nginx correctly as PID 1
# in the foreground with signals forwarded — restating it here is just
# being explicit about what actually runs.
CMD ["nginx", "-g", "daemon off;"]
