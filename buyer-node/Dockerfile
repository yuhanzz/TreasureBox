FROM node:alpine

RUN apk --no-cache add --virtual builds-deps build-base python
RUN apk add --no-cache nodejs npm


WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 15003


ENTRYPOINT ["node"]

CMD ["peer.js"]
