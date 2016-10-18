import React from 'react';
import Relay from 'react-relay';
import { Link } from 'react-router';

class PostItem extends React.Component {
  static propTypes = {
    post: React.PropTypes.object.isRequired,
    relay: React.PropTypes.object.isRequired,
  };  
  render() {
    return (
      <div>
        <h3>Details</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Revision</th>
              <th>Title</th>
              <th>Body</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{this.props.post.id}</td>
              <td>{this.props.post.rev}</td>
              <td>{this.props.post.title}</td>
              <td>{this.props.post.body}</td>
              <td>
                <Link to={`/posts/update/${this.props.post.id}`}>Update</Link> | <Link to={`/posts/delete/${this.props.post.id}`}>Delete</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

export default Relay.createContainer(PostItem, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        id
      }
    `,    
    post: (variables) => Relay.QL`
      fragment on Post {
        id
        rev
        title
        body
      }
    `
  }
});