# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build 2>/dev/null || true

# Stage 2: Run — chỉ copy artifact, không có node_modules dev
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/index.js ./

EXPOSE 3000

CMD ["node", "index.js"]
