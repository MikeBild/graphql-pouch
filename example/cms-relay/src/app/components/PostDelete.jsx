import React from 'react';
import Relay from 'react-relay';
import { Link, browserHistory } from 'react-router';

class PostDelete extends React.Component {
  static propTypes = {
    post: React.PropTypes.object.isRequired,
    viewer: React.PropTypes.object.isRequired,
    relay: React.PropTypes.object.isRequired,
  };  
  deleteItem = () => {
    let onFailure = transaction => alert(`Failure: ${transaction.getError()}`);
    let onSuccess = transaction => browserHistory.push('/posts');
    let item = {
      id: this.props.post.id,
      viewer: this.props.viewer
    };
    Relay.Store.commitUpdate(new DeleteMutation(item), {onFailure, onSuccess});
  }
  render() {
    return (
      <div>
        <h3>Delete</h3>
        <div>{`ID: ${this.props.post.id}`}</div>
        <div>{`Revision: ${this.props.post.rev}`}</div>
        <hr/>        
        <div>Title: {this.props.post.title}</div>
        <div>Body: {this.props.post.body}</div>
        <hr/>
        <div><button onClick={this.deleteItem}>Delete</button></div>
      </div>
    )
  }
}

class DeleteMutation extends Relay.Mutation {
  getVariables() {
    return {
      id: this.props.id
    };
  }
  getConfigs() {
    return [{
      type: 'NODE_DELETE',
      parentName: 'viewer',
      parentID: this.props.viewer.id,
      connectionName: 'allPosts',
      deletedIDFieldName: 'deletedPostId',
    }, {
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        post: this.props.id,
      },
    }];
  }
  getFatQuery() {
    return Relay.QL`
      fragment on DeletePostPayload @relay(pattern: true){
        deletedPostId
        post {
          id
          rev
          title
          body
        }
        viewer {
          id
        }
      }
    `;
  }
  getMutation() {
    return Relay.QL`mutation {deletePost}`;
  }
}

export default Relay.createContainer(PostDelete, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        id
      }
    `,    
    post: () => Relay.QL`
      fragment on Post {
        id
        rev
        title
        body
      }
    `,
  },
});
