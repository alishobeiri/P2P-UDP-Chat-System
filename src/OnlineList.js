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
    return (
      <ListView className="online-list">
        <ListViewSection>
          {this.props.users &&
            this.props.users.map((users, index) => {
              let user = users[index]
              console.log("User: ", user);

              if (user.id === this.props.currentUser.id) {
                return this.renderItem(
                  `${user.name} (You)`,
                  user.id
                )
              }
              return this.renderItem(user.name, user.id)
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
