FROM node:25.8.1-alpine3.23

WORKDIR /app

COPY ./arrange ./arrange/
COPY ./package*.json ./
COPY ./server.crt ./
COPY ./server.key ./
COPY ./server.mjs ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

ENV PORT=3000

EXPOSE 3000

CMD ["node", "./server.mjs"]