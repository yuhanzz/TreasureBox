FROM node:alpine

RUN apk add build-base
RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache nodejs npm


WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 15003 8080

ENTRYPOINT ["npm"]

CMD ["start"]
