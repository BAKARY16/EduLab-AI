FROM python:3.11-slim
WORKDIR /workspace
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HF_HOME=/workspace/.hf-cache
RUN pip install --timeout 180 --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.5.1
RUN pip install --timeout 180 --no-cache-dir transformers==4.53.3 peft==0.16.0 accelerate==1.9.0 \
      safetensors==0.5.3 fastapi==0.116.1 uvicorn==0.35.0
COPY ml/teacher /workspace/ml/teacher
COPY data/processed /workspace/data/processed
COPY models /workspace/models
EXPOSE 8010
CMD ["python", "-m", "ml.teacher.server"]
