FROM node:alpine

RUN apk add build-base
RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache nodejs npm


WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 11003


ENTRYPOINT ["node"]

CMD ["mqtt_client.js"]
