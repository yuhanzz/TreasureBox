FROM node:alpine

RUN apk add build-base
RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache nodejs npm


WORKDIR /app

COPY . /app

RUN npm install --global libp2p-relay-server   

EXPOSE 15003

ENTRYPOINT ["libp2p-relay-server"]

CMD ["--peerId", "./peer-id.json", "--listenMultiaddrs", "/ip4/0.0.0.0/tcp/15003" ]