FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PRELEGAL_DB_PATH=/tmp/prelegal/prelegal.sqlite3
ENV PRELEGAL_STATIC_DIR=/app/static

WORKDIR /app/backend
COPY backend/pyproject.toml ./
COPY backend/prelegal_api ./prelegal_api
RUN pip install --no-cache-dir .
COPY --from=frontend-builder /app/frontend/out /app/static

EXPOSE 8000
CMD ["uvicorn", "prelegal_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
