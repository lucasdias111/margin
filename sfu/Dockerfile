FROM node:22-alpine AS builder

RUN apk add --no-cache python3 py3-pip make g++ linux-headers

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

RUN apk add --no-cache python3 py3-pip make g++ linux-headers

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]