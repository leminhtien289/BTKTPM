FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Tạo RSA key pair khi build image
RUN node scripts/generateKeys.js

EXPOSE 4000

CMD ["npm", "start"]
