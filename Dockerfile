FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG APP_API_URL
ARG APP_MINIO_URL

RUN sed -i "s|apiUrl: ''|apiUrl: '${APP_API_URL}'|g" src/environments/environment.prod.ts \
  && sed -i "s|minioUrl: 'http://localhost:9000'|minioUrl: '${APP_MINIO_URL}'|g" src/environments/environment.prod.ts \
  && npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json

EXPOSE 4000

CMD ["node", "dist/app/server/server.mjs"]
