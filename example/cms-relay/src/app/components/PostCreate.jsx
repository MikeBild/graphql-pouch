import React from 'react';
import Relay from 'react-relay';
import { Link, browserHistory } from 'react-router';

export default class PostCreate extends React.Component {
  static propTypes = {
    relay: React.PropTypes.object.isRequired,
    viewer: React.PropTypes.object.isRequired,
  };
  createPost = () => {
    let onFailure = transaction => alert(`Failure: ${transaction.getError()}`);
    let onSuccess = transaction => browserHistory.push('/posts');
    let post = {
      title: this.refs.title.value,
      body: this.refs.body.value,
      blogId: this.refs.blogId ? this.refs.blogId.value : undefined,
      personId: this.refs.personId ? this.refs.personId.value : undefined,
      viewer: this.props.viewer
    };
    Relay.Store.commitUpdate(new PostMutation(post), {onFailure, onSuccess});
  }
  render() {
    return (
      <div>
        <h3>Create</h3>
        <hr />
        <div>
          <input type="text" placeholder="Enter a title" ref="title" />
        </div>
        <div>
          <input type="text" placeholder="Enter a body" ref="body" />
        </div>
        <hr/>
        <div><button onClick={this.createPost}>Create</button></div>
      </div>
    )
  }
}

class PostMutation extends Relay.Mutation {
  getVariables() {
    return {
      title: this.props.title,
      body: this.props.body,
      blogId: this.props.blogId || 'myblog', 
      personId: this.props.personId || 'joe'
    };
  }
  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentID: this.props.viewer.id,
      connectionName: 'allPosts',
      edgeName: 'postEdge',
      rangeBehaviors: {
        '': 'prepend',
      },
    }, {
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        viewer: this.props.viewer.id,
      },
    }];
  }
  getFatQuery() {
    return Relay.QL`
      fragment on UpsertPostPayload @relay(pattern: true){
        upsertedPostId
        postEdge {
          cursor
          node {
            id
          }
        }
        viewer {
          id
          allPosts {
            edges {
              node {
                id
              }
            }
          }
        }        
      }
    `;
  }
  getMutation() {
    return Relay.QL`mutation {upsertPost}`;
  }
}

export default Relay.createContainer(PostCreate, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        id
      }
    `,
  },
});