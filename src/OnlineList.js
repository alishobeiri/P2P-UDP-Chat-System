import React, { Component } from 'react'
import {
  ListView,
  ListViewSection,
  ListViewSectionHeader,
  ListViewRow,
  Text
} from 'react-desktop/macOs'

class OnlineList extends Component {
  render() {
    console.log("List Users: ", this.props.users);
    console.log("Props: ", this.props);
    return (
      <ListView className="online-list">
        <ListViewSection>
          {this.props.users &&
            this.props.users.map((users, index) => {
              console.log("Users: ", users);
              console.log("currentId: ", this.props.currentId);
              if (users.client_id === this.props.currentId) {
                return this.renderItem(
                  `${users.client_name} (You)`,
                  users.client_id
                )
              }
              return this.renderItem(users.client_name, users.client_id)
            })}
        </ListViewSection>
      </ListView>
    )
  }

  renderItem(name, id) {
    const itemStyle = {}
    console.log("ID is: ", id);
    return (
      <ListViewRow key={id}>
        <div
          className="online-list-item"
          style={{
            background: '#6BD761'
          }}
        />
        <Text color="#414141" size="13">
          {name}{' '}
        </Text>{' '}
      </ListViewRow>
    )
  }
}

export default OnlineList
