FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json .
COPY ../package.json ./../package.json
RUN npm install && npm install -g prisma
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3001
CMD ["npm","run","start"]
