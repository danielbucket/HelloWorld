FROM node:20-alpine

WORKDIR /app
COPY package.json /app/package.json
RUN npm install --omit=dev
COPY server.js /app/server.js

USER node

ENV PORT=3000 \
    METRICS_API_URL=http://metrics-api:8000/metrics

EXPOSE 3000
CMD ["node", "server.js"]
