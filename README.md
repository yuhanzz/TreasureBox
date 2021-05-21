# TreasureBox
A P2P second hand trading system
## How to start the project

### 1. Start one or more bootstrapper node
We can start up bootstrapper nodes in the P2P network as the entrypoint for peer discovery.  
```
cd bootstrapper  
sudo docker build -t bootstrapper .  
sudo docker run -d -p 15003:15003 bootstrapper:latest  
```
The commands above start a bootstrapper node with a fixed peer id using peer-id.json. If we want to start another bootstrapper node, we need to generate a new peer id and update peer-id.json. we can use CLI to generate a new peer id: https://github.com/libp2p/js-peer-id#cli  

After the bootstrapper nodes are running, we need to add the address of the bootstrapper nodes in config.json of each p2p node. As long as one of the nodes in config.json is running, new nodes can join the network.  

### 2. Start one or more item storage node
```
cd item-storage-node  
sudo docker-compose up  
```

### 3. Start one or more item collection node
```
cd item-collection-node  
sudo docker build . -t item-collection-node  
sudo docker run -d --name collection --network=host item-collection-node:latest  
```

### 4. Start recommendation node
```
cd recommendation-node  
sudo docker build -t recommendation-node .  
sudo docker run -d --name recommendation --network=host recommendation-node:latest  
```

### 5. Start buyer node
```
cd buyer-node  
sudo docker-compose up  
```

### 6. Start seller node
```
sudo docker build -t seller-node .  
sudo docker run -d --name seller --network=host seller-node:latest  
```

### 7. blockchain
/blockchain folder contains the smart contracts and the truffle configurations for deploying the contract. 

### 8. machine learning
/machine-learning folder contains the code we run on AWS lambda and AWS SageMaker for creating the machine learning endpoint.

### Notes
1. We've closed our Amazon RDS, Google pub/sub, Amazon Lambda and Amazon SageMaker services, so the nodes should be reconfigured using new cloud services crendentials in order to work properly. 
2. If you have a Linux machine, the nodes could be running properly using docker. If you have a Mac machine, due to some limitation of docker for mac, bugs might be encountered because it fails to find the right ip address using host network mode. So on Mac, you might want to start the project without docker. The instructions for starting the seller-node and buyer-node locally without docker are placed in the README of seller-node and buyer-node.


## Design diagrams

### Architecture
![Alt text](images/image1.png?raw=true "Title")
### Sell item flow
![Alt text](images/image2.png?raw=true "Title")

### Search item flow
![Alt text](images/image3.png?raw=true "Title")

### Order item flow
![Alt text](images/image4.png?raw=true "Title")

### recommendation flow - part 1: initialization
![Alt text](images/image5.png?raw=true "Title")

### recommendation flow - part 2: update geolocation
![Alt text](images/image6.png?raw=true "Title")