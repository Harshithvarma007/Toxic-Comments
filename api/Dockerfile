# syntax=docker/dockerfile:1.7
# Small CPU image: ONNX Runtime + tokenizers, no torch. Model files are baked in (~35 MB),
# so a cold start is "load 35 MB from local disk", not "download from a hub".
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    TOXIC_MODEL_DIR=/app/model PORT=8000
WORKDIR /app
RUN useradd --create-home --uid 10001 app
COPY requirements.txt .
RUN pip install -r requirements.txt \
    && pip uninstall -y sympy mpmath hf-xet \
    && find /usr/local/lib/python3.12 -name "__pycache__" -prune -exec rm -rf {} +
COPY app ./app
COPY model ./model
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/readyz')"
# One worker per container; scale by adding containers. ONNX Runtime uses the cores itself.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
