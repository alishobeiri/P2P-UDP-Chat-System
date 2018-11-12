import React, { Component } from 'react'
import UsernameForm from './UsernameForm'
import Chat from './Chat'
import io from "socket.io-client";

class App extends Component {

  state = {
    currentUsername: null,
    currentId: null,
    currentScreen: 'usernameForm',
    socket: io('localhost:8080')
  }


  onUsernameSubmitted = username => {
    this.setState({
      name: username,
      currentId: Math.random(),
      currentScreen: "chat"
    })

    this.state.socket.emit('REGISTER_USER', {
      name: username
    });
  }

  render() {
    if (this.state.currentScreen === 'usernameForm') {
      return <UsernameForm handleSubmit={this.onUsernameSubmitted} />
    }

    if (this.state.currentScreen === 'chat') {
      return <Chat name={this.state.name} currentId={this.state.currentId} socket={this.state.socket} />
    }
  }
}

export default App
