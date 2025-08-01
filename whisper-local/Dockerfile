# Dockerfile para Whisper + Flask API
FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

# Instala ffmpeg e dependências
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia dependências e instala
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia código
COPY app.py .

# Cria pasta de uploads
RUN mkdir -p /tmp/uploads

EXPOSE 5000
CMD ["python", "app.py"]
