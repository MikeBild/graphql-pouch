import React from 'react';
import Relay from 'react-relay';
import { Link, browserHistory } from 'react-router';

class PostUpdate extends React.Component {
  static propTypes = {
    post: React.PropTypes.object.isRequired,
    viewer: React.PropTypes.object.isRequired,
    relay: React.PropTypes.object.isRequired,
  };  
  updatePost = () => {
    let onFailure = transaction => alert(`Failure: ${transaction.getError()}`);
    let onSuccess = transaction => browserHistory.push('/posts');
    let post = {
      id: this.props.post.id,
      rev: this.props.post.rev,
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
        <h3>Update</h3>
        <div>{`ID: ${this.props.post.id}`}</div>
        <div>{`Revision: ${this.props.post.rev}`}</div>
        <hr/>
        <div>
          <input type="text" placeholder="Enter a post title" ref="title" defaultValue={this.props.post.title}/>
        </div>
        <div>
          <input type="text" placeholder="Enter a post body" ref="body" defaultValue={this.props.post.body}/>
        </div>
        <hr />
        <div><button onClick={this.updatePost}>Update</button></div>
      </div>
    )
  }
}

class PostMutation extends Relay.Mutation { 
  getVariables() {
    return {
      id: this.props.id,
      rev: this.props.rev,
      title: this.props.title,
      body: this.props.body,
      blogId: this.props.blogId || 'myblog', 
      personId: this.props.personId || 'joe'
    };
  }
  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        post: this.props.id,
      }
    }];
  }
  getFatQuery() {
    return Relay.QL`
      fragment on UpsertPostPayload @relay(pattern: true){
        upsertedPostId
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
    return Relay.QL`mutation {upsertPost}`;
  }
}

export default Relay.createContainer(PostUpdate, {
  fragments: {
    post: (variables) => Relay.QL`
      fragment on Post {
        id
        rev
        title
        body
      }
    `,
    viewer: () => Relay.QL`
      fragment on Viewer {
        id
      }
    `,    
  }
});
