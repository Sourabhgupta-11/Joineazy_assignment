FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "node src/utils/migrate.js && node src/index.js"]
