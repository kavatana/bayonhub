FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
RUN apk add --no-cache openssl
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 4000
USER appuser
CMD ["sh", "railway-start.sh"]
