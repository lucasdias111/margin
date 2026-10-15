# Debian rather than Alpine: mediasoup ships its C++ worker as a prebuilt
# glibc binary, which cannot run on musl.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Makes mediasoup's postinstall skip building the worker from source. This
# stage only runs tsc, so it never actually executes the worker.
ENV MEDIASOUP_WORKER_BIN=/usr/local/bin/mediasoup-worker

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV MEDIASOUP_WORKER_BIN=/usr/local/bin/mediasoup-worker

COPY package*.json ./
RUN npm ci --omit=dev

# Install the prebuilt worker instead of compiling it. mediasoup's own
# postinstall derives the download name from the *running* kernel version, so
# under a kernel newer than any published build it falls back to a ~30 minute
# source build. Pin the kernel6 asset: the worker checks kernel support for
# io_uring at runtime and disables it when unavailable.
RUN set -eu; \
    version="$(node -p 'JSON.parse(require("fs").readFileSync("/app/node_modules/mediasoup/package.json", "utf8")).version')"; \
    case "$(dpkg --print-architecture)" in \
      amd64) arch=x64 ;; \
      arm64) arch=arm64 ;; \
      *) echo "no mediasoup prebuilt for $(dpkg --print-architecture)" >&2; exit 1 ;; \
    esac; \
    url="https://github.com/versatica/mediasoup/releases/download/${version}/mediasoup-worker-${version}-linux-${arch}-kernel6.tgz"; \
    echo "fetching ${url}"; \
    node -e 'fetch(process.argv[1]).then(r => { if (!r.ok) throw new Error(r.status + " " + r.statusText); return r.arrayBuffer(); }).then(b => require("fs").writeFileSync("/tmp/worker.tgz", Buffer.from(b)));' "${url}"; \
    tar xzf /tmp/worker.tgz -C /usr/local/bin; \
    rm /tmp/worker.tgz; \
    chmod +x "$MEDIASOUP_WORKER_BIN"; \
    ldd "$MEDIASOUP_WORKER_BIN" | grep -q 'not found' && exit 1 || true

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
