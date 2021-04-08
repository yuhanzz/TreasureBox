```
docker build -t p2p-peer:latest .
docker run -it -d -p 15003:15003 p2p-peer:latest
```