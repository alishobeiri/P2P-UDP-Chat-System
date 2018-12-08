# P2P Chat System
This is a peer to peer chat system implemented using NodeJS and React. This system performs NAT traversal using 
UDP punchthrough techniques. 

### UDP Punchthrough
To allow two peers behind NATs to connect to one another directly, a third observer, in our case implemented, a server is needed to facilitate their communication. This server will save the details of each peer (public IP, NAT assigned port mapping and private IP). When a new peer wishes to join the network, it will first register itself with the server. The server will then communicate with all existing peers on the network and send the details of the newly connecting peer. 

Each peer, whether newly connected or established will then send each other a flow of UDP packets at the same time. This is done to circumvent firewall protections on the NAT by masquerading as a reply to a previously sent UDP packet by the client. 

For more information for those interested, the methodology behind the system and the implementation details can be found [here](https://github.com/alishobeiri/Peer-2-Peer-UDP-Chat-System/blob/master/Report.pdf).

### Implementation
Server - NodeJS
Client Proxy Server - NodeJS
Frontend - React

# To Run the System
#### First run:
To intall the necessary dependencies, first use:  
```npm install```

#### Client Setup:
To the client proxy server, perform the following commands:  
```cd backend```
```node client.js```

To run the frontend application, in a separate command window perform the following commands:  
`npm run dev`

#### Server Setup:
To run the server, run the server.js file on a remote public device. To do this, use:  
```cd server```
```node server.js```

Ensure to change this [variable](https://github.com/alishobeiri/Peer-2-Peer-UDP-Chat-System/blob/master/backend/client.js#L8) to point to the IP address of your server. 
