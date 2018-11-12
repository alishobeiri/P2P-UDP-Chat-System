import React, { Component } from 'react'
import {
  ListView,
  ListViewSection,
  ListViewSectionHeader,
  ListViewRow,
  Text
} from 'react-desktop/macOs'

class MessageList extends Component {
  render() {
    return (
      <ListView>
        <ListViewSection>
          {this.props.messages.map((message, index) =>
            this.renderItem(message)
          )}
        </ListViewSection>
      </ListView>
    )
  }

  renderItem(message) {
    console.log(message.key);
    return (
      <ListViewRow key={message.key}>
        <Text color="#414141" size="13" bold>
          {message.author}:&nbsp;  
        </Text>
        <Text color="#414141" size="13">
          {message.message}
        </Text>
      </ListViewRow>
    )
  }
}

export default MessageList
