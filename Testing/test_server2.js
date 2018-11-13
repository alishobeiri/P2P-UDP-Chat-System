var dgram = require("dgram");
var ip = require("ip");
var publicIp = require("public-ip");

var server = dgram.createSocket("udp4");

var clientList = [];
// var idList = [];

let public_ip = null; 
// publicIp.v4().then(ip => {
//     public_ip = ip;
// });
server.bind(3000, ip.address());

//Let user know that server is successfully running, and on which address:port
server.on("listening", () => {
	const address = server.address();
	console.log(`Listening at ${address.address}:${address.port}`);
	// setInterval(pingClients, 10000); //Every 10 seconds, ping all clients to see if they're still there
	setInterval(sendPing, 10000);
	setInterval(receivePing, 15000);
});

//Register new client (takes as input msg and rinfo OBJECTS. i.e. msg must be in JSON form, not string form)
const registerClient = (msg, rinfo)=> {
	let new_client_id = parseInt(Math.random()*(256));
  	let new_client = {
  		public_ip: rinfo.address,
  		public_port: rinfo.port,
		client_name: msg.client_name, 
		private_ip: msg.private_ip,
		client_id: new_client_id, 
		private_port: msg.private_port,
		send_ip: 0,
		send_port: 0,
		ping_sent: false,
		ping_received: false, 
  	};
  	console.log(`New client, ${new_client.client_name}, has been registered`);
  	console.log(`${new_client.client_name}'s public address is ${new_client.public_ip}:${new_client.public_port}`);
  	console.log(`${new_client.client_name}'s private address is ${new_client.private_ip}:${new_client.private_port}`);
  	console.log(`${new_client.client_name}'s client ID is ${new_client.client_id}`);
  
	//Alert all other clients about the new client
	let newClientMessage = JSON.stringify({
			msg_type: "new_client",
			new_client: new_client,
			clientList: clientList,
    });
	clientList.forEach(client => {
    	server.send(newClientMessage, client.public_port, client.public_ip);
  	});

  
 	//Send the new client the current client list
  	let regResponseMessage = JSON.stringify({
  		msg_type: "reg_response",
		clientList: clientList,
		client_id: new_client_id,
	});
  	server.send(regResponseMessage, new_client.public_port, new_client.public_ip);
  	clientList.push(new_client); //Might want to add new_client to clientList before sending clientList to new_client? Not sure why they did it after
  	console.log(`clientList length: ${clientList.length}`);
};

//Test methods to be executed every ~20 seconds to check if clients are still connected--------------------------------------------------------
const pingClients = () => {// Uses two other helper functions
	//Call send ping function, ping_acks will be handled in the server.on("message", (msg, rinfo)) function
	sendPing();
	setTimeout(receivePing, 1500);//Wait 1.5 seconds, then call receive ping function
};

const sendPing = () => {
	let ping = JSON.stringify({
		msg_type: "ping",
	});
	if(clientList.length > 0){
		clientList.forEach((client) =>{
			server.send(ping, client.public_port, client.public_ip);
			console.log(`Ping sent to ${client.client_name}`);
			client.ping_sent = true;
		});
	}
};

const receivePing = () => {
	if(clientList.length > 0){
		let oldLength = clientList.length;
		// clientList = clientList.filter(client => !((client.ping_sent) && (!client.ping_received))); //Remove all clients where ping was sent but not received
		let new_clientList = [];
		let lost_client_names = []; //Array containing names of clients who have left the network (will often just be one client)
		clientList.forEach((client) => {
			if((client.ping_sent) && (!client.ping_received)){
				lost_client_names.push(client.client_name);
			} else{
				new_clientList.push(client);
			}
		});
		// let newLength = clientList.length;
		let newLength = new_clientList.length;
		clientList = new_clientList;

		if(oldLength != newLength){ //If clients have been removed bc they're unresponsive, alert all current clients of new clientList
			console.log(`A client has left. There were ${oldLength} clients, now there are ${newLength} clients`);
			console.log("Current clientList:", clientList);
			let lostClientMessage = JSON.stringify({
					msg_type: "lost_client",
					clientList: clientList,
					lost_client_names: lost_client_names,
		    });
			clientList.forEach(client => {
		    	server.send(lostClientMessage, client.public_port, client.public_ip);
		  	});
		}

		//Reset ping_sent and ping_received back to false
		if(clientList.length > 0){
			clientList.forEach((client) => {
				client.ping_sent = false;
				client.ping_received = false;
			});
		}
	}
};
//------------------------------------------------------------------------------------------------------------------------------------------------



server.on("message", (msg, rinfo) => {
	msg = JSON.parse(msg);
	switch(msg.msg_type){
		case "reg_request":
			registerClient(msg, rinfo);
			break;
		case "ping_ack":
			console.log(`Ping ACK received, ${msg.client_name} is still connected`);
			clientList.forEach((client) => {
				if(client.client_id===msg.client_id){
					client.ping_received = true;
				}
			});
	}
});




