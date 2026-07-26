FROM python:3.11-slim
WORKDIR /app
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api/app ./app
COPY rag ./rag
COPY services ./services
COPY ml/artifacts ./ml/artifacts
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
