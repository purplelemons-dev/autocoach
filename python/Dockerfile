FROM python:3.12.1-slim-bookworm

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

RUN apt update && apt upgrade -y
RUN apt install -y chromium --fix-missing

COPY . .

CMD ["python", "-u", "server.py"]
