import React, { Component } from 'react'
import { ChatManager, TokenProvider } from '@pusher/chatkit'
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


    this.props.socket.on('RECEIVE_MESSAGE', function(data){
      addMessage(data);
    });

    this.props.socket.on('NEW_USER', function(data){
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
      this.setState({users: [data]});
      console.log(this.state.users);
    };

    this.addMessage = addMessage;
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
