# TreasureBox

1. Build and run p2p-boostrapper
```
cd bootstrapper
docker build -t p2p-boostrapper:latest .
docker run -it -d -p 15003:15003 p2p-boostrapper:latest 
```
2. Check the multiAddr of boostrapper node in docker logs, change the bootstrapMultiaddrs in peer/config.json

3. Build and run p2p-peer, remember to change the host port if having multiple container running
```
cd peer
docker build -t p2p-peer:latest .
docker run -it -d -p 15002:15003 p2p-peer:latest
```


### Handshake (Similar to Gnutella 0.6)

#### Interaction between buyer node and item collection node

requestor:
message title: search_item_query
{
  searchCategory: 'book',
  peerId: 'QmYAAzFJ5gicPcxfbvDM1jq94m9X7xtLY2mPy2V1Qv7Z9N'
  queryId: 'QmYAAzFJ5gicPcxfbvDM1jq94m9X7xtLY2mPy2V1Qv7Z9N-1619730897994-0'
}

After search_item_query is sent, it will be stored in a HashMap with the following format:
key: request_id(timestamp + id), value: part of the message body for search_item_request

provider:
message title: QmYAAzFJ5gicPcxfbvDM1jq94m9X7xtLY2mPy2V1Qv7Z9N (peerId of the requestor)
{
    type: 'search_item_query_hit'
    queryId: queryId extracted from the query body
}

When the requestor received the first response from the provider, it will send the following message with
the peer id of the first responded provider, then this request id will be removed in the HashMap, so that the 
following query hit response will be ignored. 

requestor: (Choose the peer with fasted respond)
message title: QmYs36261DpmVUxqBNrYcz5FRm11F2fApet1yZTGLbgCRp
{
    type: 'search_item_request'
    searchCategory: 'book'
    peer_id: QmdLdBSbAHBdnEDtdEeTLisF3EzXwNQtbgymhX1svPH3ZS
}

provider:
message title: QmdLdBSbAHBdnEDtdEeTLisF3EzXwNQtbgymhX1svPH3ZS
{
    type: search_item_response
    content: {
        "name": "The Sign of the Four",
        "detail": "Written by Sherlock Holmes. Bought in 2010.",
        "picture": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAzgAAAHeC...."   // use Base 64 Encoding
    }
}


### Item search flow

buyer node:
    send:
        search_item_request
    handle:
        search_item_response

seller node:
    send:
        post_item_request

item collection node:
    send:
        search_item_response
    handle:
        search_item_request

MQTT node:
    handle:
        post_item_request


### Tech stack
all node:
    node.js
    libp2p
    docker
    mosquitto

buyer node:
    express.js


### TODO
Need to prevent empty input in text box


### on AWS EC2
sudo yum update -y
sudo yum groupinstall "Development Tools" -y
sudo amazon-linux-extras install docker -y

sudo service docker start
sudo docker build -t p2p-boostrapper:latest .
sudo docker run -it -p 15003:15003 p2p-boostrapper:latest

### on local
might need to remove node_modules when error occurs