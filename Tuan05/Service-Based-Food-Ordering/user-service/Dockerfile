FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.js ./

EXPOSE 8081
CMD ["node", "index.js"]
