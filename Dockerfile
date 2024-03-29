FROM node:lts-slim

WORKDIR /app

COPY ./package.json /app/package.json
RUN npm install

COPY . /app

EXPOSE 3344

CMD ["npm", "start"]
