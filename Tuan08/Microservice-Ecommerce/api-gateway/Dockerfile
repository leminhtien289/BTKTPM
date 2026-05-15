FROM node:18-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
RUN mkdir -p /data
COPY package.json .
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]
