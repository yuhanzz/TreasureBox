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