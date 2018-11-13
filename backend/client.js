var express = require('express');
var app = express();
var dgram = require("dgram");
var publicIp = require("public-ip");
var ip = require("ip");
var Address4 = require('ip-address').Address4;

const server_ip = "142.93.146.158"; //Sever IP and port will prob be obtained from calling arguments or something, hardcoded atm
const server_port = 3000

var client = dgram.createSocket("udp4");

let private_port; //Will be initialized to whatever port that is chosen by client.bind()
let private_ip; //Will be initialized to whatever ip address is initialized by client.bind()
let client_id; //Client ID number so server can identify it, will be assigned by server in reg_response message
let client_name; //To be specified by client host, won't be hardcoded to "Nathan"
let peersList = []; //List of peers connected to network (excluding self), will be obtained from server
let unpunchedPeers = []; //List of peers connected to network (excluding self) that have not yet been hole punched


server = app.listen(8080, function(){
    console.log('server is running on port 8080')
});


var socket = require('socket.io');
io = socket(server);

io.on('connection', (socket) => {
    socket.on("REGISTER_USER", function(data) {
        client_name = data.name;
        const clientAddress = client.address(); 
        private_port = clientAddress.port; 
        private_ip = ip.address(); 
		// console.log("New User");
		console.log(`${client_name}, you are about to register yourself with the Server...`);
        //Check validity of server IP address
        let address = new Address4(server_ip);
        if(address.isValid()){
            registerSelf(server_ip, server_port);
        } else{
            console.log(`${server_ip} is not a valid IP address`);
            client.close();
            process.exit();
        }
    });

    socket.on("SEND_MESSAGE", function(data){
        console.log(data);
        sendMessage(data);
    })
});

//Function to send chat message received from frontend
const sendMessage = (data) => {
	//Create registration request message
	let msg = JSON.stringify({
        msg_type: "chat_message",
        id: Math.random(),
        message: data.text,
        author: data.author
	});
    console.log("Sending clients message");
    console.log("Msg: ", msg);
    console.log("Peers: ", peersList);
    peersList.forEach((peer) => {
        console.log("Peer: ", peer);
        console.log(`${peer.client_name}'s send_port: ${peer.send_port}`);
        console.log(`${peer.client_name}'s send_ip: ${peer.send_ip}`);
        client.send(msg, peer.send_port, peer.send_ip);
    });
};

//Function to register self to server
const registerSelf = (server_ip, server_port) => {
	//Create registration request message
	let msg = JSON.stringify({
		msg_type: "reg_request",
		private_ip: ip.address(), 	//Private port and IP address are sent inside the message, public port and IP address will be 
		private_port: private_port, //obtained from the udp packet header on the server side.
		client_name: client_name,
	});
	console.log("Sending client packet to server...");
	client.send(msg, server_port, server_ip);
	console.log("Client packet sent, waiting on server response...");
};

//This function sends a hole punch SYN to each un-punched peer on their public AND private addresses (according to a document I read)
//(Adapted from holepunch function in the original client.js file)
const sendSYN = (counter) => { 
	if(counter === undefined){
		counter = 10;
	}
	if (unpunchedPeers.length > 0) {
    	unpunchedPeers.forEach(peer => {
      		console.log(`Attempting holepunch SYN with ${peer.client_name}`); //To be removed later (not part of chatroom)

      		//Hole punch attempt with public address
      		let holePunchMessagePublic = JSON.stringify({
      			msg_type: "holepunch_syn", //Set message type to holepunch_syn so receiver knows it is being hole punched
      			client_name: client_name, //Self's client name
      		});
      		client.send(holePunchMessagePublic, peer.public_port, peer.public_ip);

      		//Hole punch attempt with private address
      		let holePunchMessagePrivate = JSON.stringify({
      			msg_type: "holepunch_syn",
      			client_name: client_name,
      			private_ip: private_ip,
      			private_port: private_port,
      		});
      		client.send(holePunchMessagePrivate, peer.private_port, peer.private_ip);
      		
    	});

    	//Not too sure what this part does but it's also in the original client.js file
    	if (counter && counter > 0) { 
     		counter--;
      		setTimeout(() => {sendSYN(counter);}, 100);
    	}
  	} 
}

//This function sends a hole punch ACK to whichever peer successfully holepunched 
//(It gets called when a message is received with msg_type = holepunch_syn)
const sendACK = (msg, rinfo) => {
	let src_ip = rinfo.address; //Source IP of holepunch_syn message that was received
	let src_port = rinfo.port; //Source port of holepunch_syn message that was received
	let ackMessage = JSON.stringify({
		msg_type: "holepunch_ack", //Set msg_type to holepunch_ack so receiver knows you have received its holepunch syn
		client_name: client_name, //Self's client name
	});
	client.send(ackMessage, src_port, src_ip);

	//Find client in peersList that sent the holepunch SYN and add send_ip and send_port attributes (used for chatting)
	//This is to ensure that chat messages are sent on the address that successfully hole punched (i.e. either private or public)
	//Most often it will be public, unless both end hosts are on the same private network
	peersList.forEach((peer) => {
		if(((peer.private_ip===src_ip)&&(peer.private_port===src_port))||((peer.public_ip===src_ip)&&(peer.public_port===src_port))){
			// peer = Object.assign({}, peer, {send_ip: src_ip}, {send_port: src_port});
			peer.send_ip = src_ip;
			peer.send_port = src_port;
			console.log(`Sending IP and port have been defined:`);
			console.log(`send_ip: ${src_ip}`);
			console.log(`send_port: ${src_port}`);
		}
	});
}

//This function takes actions based on a received hole punch ACK message
const receiveACK = (msg, rinfo) => {
	let src_ip = rinfo.address; //Source IP of holepunch_ack message that was received
	let src_port = rinfo.port; //Source port of holepunch_ack message that was received

	//We have successfully holepunched with sender peer, so remove them from unpunchedPeers
	unpunchedPeers = unpunchedPeers.filter(peer => !(((peer.private_ip===src_ip)&&(peer.private_port===src_port))||((peer.public_ip===src_ip)&&(peer.public_port===src_port))));

	//Find sender peer in peersList and add send_ip and send_port attributes (used for chatting)
    //Same concept as in sendACK() function
    console.log("ACK: ", msg);
    // let new_peer = {
    //     name: msg.client_name,
    //     id: peersList.length,
    //     present_state: "Active",
    //     send_ip: src_ip,
    //     send_port: src_port
    // };
    // peersList.push(new_peer);
    io.emit("NEW_USER", peersList);
	peersList.forEach((peer) => {
		if(((peer.private_ip===src_ip)&&(peer.private_port===src_port))||((peer.public_ip===src_ip)&&(peer.public_port===src_port))){
			// peer = Object.assign({}, peer, {send_ip: src_ip}, {send_port: src_port});
			peer.send_ip = src_ip;
			peer.send_port = src_port;
			console.log(`Sending IP and port have been defined:`);
			console.log(`send_ip: ${src_ip}`);
			console.log(`send_port: ${src_port}`);
		}
	});
	console.log("Peers list after receicveACK: ", peersList);
}

//Function called everytime client receives a message
client.on("message", (msg, rinfo) => {
	msg = JSON.parse(msg);
	switch(msg.msg_type){
		case "reg_response":
			console.log("Server response received. You are now connected to the chatroom!");
			//Initialize peers list and list of unpunched peers, filtering out self
			peersList = msg.clientList.filter(peer => !((peer.private_ip===ip.address())&&(peer.private_port===private_port)));
			unpunchedPeers = msg.clientList.filter((peer) => !((peer.private_ip===ip.address())&&(peer.private_port===private_port)));
			console.log("Client list from server: ", msg.clientList);
			console.log("Peers list after filtering self: ", peersList);
			//Assign client_id that was sent back by server
			client_id = msg.client_id;
			console.log(`The server has sent me an ID of ${msg.client_id}`);
			console.log(`Thus, my current client ID is ${client_id}`);
			
			//call hole punch method to holepunch with entire network (you are the new clienit)
			sendSYN();
			break;
		case "new_client":
			console.log(`${msg.new_client.client_name} has joined the chatroom`);
			//Update peers list
			peersList.push(msg.new_client);
			unpunchedPeers.push(msg.new_client);

			//call hole punch method to holepunch with new client (you are already on the network)
			sendSYN();
			break;
		case "chat_message":
            console.log(`${msg.author}: ${msg.message}`);
            console.log(msg);
            io.emit("RECEIVE_MESSAGE", msg);
			break;
		case "holepunch_syn":
			console.log(`Received holepunch SYN from ${msg.client_name} (${rinfo.address}:${rinfo.port})`); //To be removed later (not part of chatroom)
			sendACK(msg, rinfo);
			break;
		case "holepunch_ack":
			console.log(`Received holepunch ACK from ${msg.client_name} (${rinfo.address}:${rinfo.port})`); //To be removed later (not part of chatroom)
			receiveACK(msg, rinfo);
			break;
		case "ping":
			//Received a ping msg from server. Send a ping_ack message that contains your client_id so server can identify you
			let pingACK = JSON.stringify({
				msg_type: "ping_ack",
				client_id: client_id,
				client_name: client_name,
			});
			client.send(pingACK, server_port, server_ip);
			break;
		case "lost_client":
			//Server has detected that a client left, update your peers list (still filtering out self)
			peersList = msg.clientList.filter(peer => !((peer.private_ip===ip.address())&&(peer.private_port===private_port)));
			//If there are unpunched peers at this point, only keep the ones that are in the updated peers list
			if(unpunchedPeers.length>0){
				unpunchedPeers = unpunchedPeers.filter(peer => peersList.includes(peer));
			}
			
	}
});


client.bind(4000)