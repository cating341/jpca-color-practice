FROM node:20-alpine
LABEL org.opencontainers.image.title="jpca-practice"
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev || true
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server/index.js"]
