# Stage 1 — Build React app (Vite)
FROM node:18-alpine AS build
WORKDIR /app

# Nhận IP các PU lúc build — baked vào bundle JS
ARG VITE_PU1_URL=http://localhost:8081
ARG VITE_PU2_URL=http://localhost:8082
ARG VITE_PU3_URL=http://localhost:8083
ARG VITE_PU4_URL=http://localhost:8084
ENV VITE_PU1_URL=$VITE_PU1_URL \
    VITE_PU2_URL=$VITE_PU2_URL \
    VITE_PU3_URL=$VITE_PU3_URL \
    VITE_PU4_URL=$VITE_PU4_URL

COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Stage 2 — Serve với nginx (nhẹ, nhanh)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
