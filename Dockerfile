# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /app

USER root
RUN apt-get update \
    && apt-get install -y procps \
    && rm -rf /var/lib/apt/lists/*

USER bun

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /tmp/dev
COPY package.json bun.lock /tmp/dev/
RUN cd /tmp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /tmp/prod
COPY package.json bun.lock /tmp/prod/
RUN cd /tmp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# build the widget
# this runs scripts/build-widget.ts
RUN bun run build:widget

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/src src
COPY --from=prerelease /app/dist dist
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/drizzle.config.ts .
COPY --from=prerelease /app/tsconfig.json .

# run the app
USER bun
EXPOSE 8000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
