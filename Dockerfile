FROM node:20-alpine

WORKDIR /app
COPY package.json /app/package.json
RUN npm install --omit=dev
COPY app.js /app/app.js

RUN useradd --system --create-home appuser
USER appuser

ENV API_HOST=0.0.0.0 \
    API_PORT=8000 \
    PROC_ROOT=/host/proc \
    SYS_ROOT=/host/sys

EXPOSE 8000

CMD ["node", "app.js"]
