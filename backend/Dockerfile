FROM python:3.14.2-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=America/New_York

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1000 app && \
    useradd -u 1000 -g app -m -s /bin/bash app

WORKDIR /app

COPY --chown=app:app pyproject.toml ./

RUN pip install --no-cache-dir -e ".[dev]"

COPY --chown=app:app . .

RUN mkdir -p /app/data && chown -R app:app /app/data

USER app

EXPOSE 8000

CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:create_app()"]
