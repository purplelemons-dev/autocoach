FROM python:3.12.1-slim-bookworm

WORKDIR /app

RUN apt update && apt upgrade -y
RUN apt install -y curl unzip

RUN curl -O "https://storage.googleapis.com/chrome-for-testing-public/127.0.6533.119/linux64/chromedriver-linux64.zip"
RUN unzip chromedriver-linux64.zip
RUN mv chromedriver-linux64/chromedriver /usr/local/bin/chromedriver

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

RUN apt install -y chromium --fix-missing

COPY . .

CMD ["python", "-u", "server.py"]
