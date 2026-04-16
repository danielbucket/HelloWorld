FROM python:3.12-slim

WORKDIR /app
COPY app.py /app/app.py

RUN useradd --system --create-home appuser
USER appuser

ENV API_HOST=0.0.0.0 \
    API_PORT=8000 \
    PROC_ROOT=/host/proc \
    SYS_ROOT=/host/sys

EXPOSE 8000

CMD ["python", "/app/app.py"]
