var dgram = require("dgram");
var ip = require("ip");
var publicIp = require("public-ip");

var server = dgram.createSocket("udp4");

var clientList = [];

let public_ip = null; 
// publicIp.v4().then(ip => {
//     public_ip = ip;
// });
server.bind(3000, ip.address());

//Let user know that server is successfully running, and on which address:port
server.on("listening", () => {
	const address = server.address();
	console.log(`Listening at ${address.address}:${address.port}`);
});

//Register new client (takes as input msg and rinfo OBJECTS. i.e. msg must be in JSON form, not string form)
const registerClient = (msg, rinfo)=> {
	let new_client = Object.assign({}, 
		// rinfo, //rinfo contains address (public address, family, port and size fields
		{ public_ip: rinfo.address },
		{ public_port: rinfo.port },
		{ client_name: msg.client_name }, 
		{ private_ip: msg.private_ip }, 
		{ private_port: msg.private_port }
  	);
  	console.log(`New client, ${new_client.client_name}, with public address ${new_client.public_ip}:${new_client.public_port} 
  		and private address ${new_client.private_ip}:${new_client.private_port} has been registered`);
  
	//Alert all other clients about the new client
	clientList.forEach(client => {
		let newClientMessage = JSON.stringify({
			msg_type: "new_client",
			new_client: new_client,
			// name: msg.name
    	});
    	server.send(newClientMessage, client.public_port, client.public_ip);
  	});

  
 	//Send the new client the current client list
 	console.log(`clientList length: ${clienitList.length}`);
  	let regResponseMessage = JSON.stringify({
  		msg_type: "reg_response",
		clientList: clientList,
	});
  	server.send(regResponseMessage, new_client.public_port, new_client.public_ip);
  	clientList.push(new_client); //Might want to add new_client to clientList before sending clientList to new_client? Not sure why they did it after
};

server.on("message", (msg, rinfo) => {
	msg = JSON.parse(msg);
	switch(msg.msg_type){
		case "reg":
			registerClient(msg, rinfo);
			break;
	}
});
