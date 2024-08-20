FROM python:3.12.1-slim-bookworm

WORKDIR /app

RUN apt update && apt upgrade -y
RUN apt install -y chromium --fix-missing

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "-u", "server.py"]
