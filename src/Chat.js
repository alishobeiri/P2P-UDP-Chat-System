import React, { Component } from 'react'
import MessageList from './MessageList'
import SendMessageForm from './SendMessageForm'
import OnlineList from './OnlineList'

class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      currentId: props.currentId,
      currentUser: props.name,
      users: [],
      messages: [],
      socket: props.socket
    };
    console.log(this.socket);

    const boundFunc = function(data) {
      console.log("OUR CLIENT ID");
      console.log(data.client_id);
      this.setState({
        currentId: data.client_id
      }, function() {
        console.log("WE MADE IT HERE");
        console.log("Function callback state:", 
                    this.state.currentId);
        console.log("Data: ", data);
        data.clientList.push({
          client_name: this.state.name, 
          client_id: this.state.currentId
        })
        addUser(data.clientList);
      });
    }.bind(this)

    this.props.socket.on("REG_RESPONSE", boundFunc);

    this.props.socket.on('RECEIVE_MESSAGE', function(data){
      addMessage(data);
    });

    this.props.socket.on('NEW_USER', function(data){
      console.log("Peers list: ", data);
      addUser(data);
    });

    const addMessage = data => {
        console.log("Message data: ", data);
        data.key = this.state.messages.length
        this.setState({messages: [...this.state.messages, data]});
        console.log("Messages: ", this.state.messages);
    };

    const addUser = data => {
      console.log("New users: ", data);
      this.setState({users: data});
      console.log(this.state.users);
    };

    this.addMessage = addMessage;
    this.addUser = addUser;
  }

  componentDidMount() {

  }

  onSend = message => {
    console.log(this.socket);
    var data = {
      id: this.state.messages.length,
      author: this.state.name,
      message: message
    }
    this.props.socket.emit('SEND_MESSAGE', data);
    console.log("LOCAL MESSAGE DATA");
    this.addMessage(data);
  }

  render() {
    return (
      <div className="wrapper">
        <div>
          <OnlineList
            currentUser={this.state.currentUser}
            users={this.state.users}
            currentId={this.state.currentId}
          />
        </div>
        <div className="chat">
          <MessageList messages={this.state.messages} />
          <SendMessageForm onSend={this.onSend} />
        </div>
      </div>
    )
  }
}

export default Chat
