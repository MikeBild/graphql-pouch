import React from 'react';
import Relay from 'react-relay';
import { Link } from 'react-router';
import PostItem from './PostItem';

export default class PostList extends React.Component {
  loadNextPage = () => {
    this.props.relay.setVariables({
      after: this.props.viewer.allPosts.pageInfo.endCursor,
      before: undefined,
      wantPrevious: false,
      wantNext: true,
    });
  }
  loadPreviousPage = () => {
    this.props.relay.setVariables({
      wantPrevious: true,
      wantNext: false,
      after: undefined,
      before: this.props.viewer.allPosts.pageInfo.startCursor
    });
  }
  render() {
    return (      
      <div>
        <h3>List</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Number</th>
              <th>ID</th>
              <th>Revision</th>
              <th>Title</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            {this.props.viewer.allPosts.edges.map(edge =>
              <tr key={edge.node.id}>
                <td>{edge.cursor}</td>
                <td><Link to={`/posts/${edge.node.id}`}>{edge.node.id}</Link></td>
                <td>{edge.node.rev}</td>
                <td>{edge.node.title}</td>
                <td>{edge.node.body}</td>
              </tr>
            )}
          </tbody>
        </table>
        <button 
          disabled={this.props.viewer.allPosts.pageInfo.startCursor === "1"}
          onClick={this.loadPreviousPage}>Previous Page
        </button> 
        <button 
          disabled={(!this.props.viewer.allPosts.pageInfo.hasNextPage)
            && (!this.props.viewer.allPosts.pageInfo.hasPreviousPage)
            && (this.props.viewer.allPosts.pageInfo.startCursor !== "1")}
          onClick={this.loadNextPage}>Next Page
        </button>
      </div>
    )
  }
}

const postConnectionFragment = Relay.QL`
  fragment on PostConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        id
        rev
        title
        body
      }
    }
  }
`;

export default Relay.createContainer(PostList, {
  initialVariables: {
    pageSize: 10,
    after: undefined,
    before: undefined,
    wantNext: true,
    wantPrevious: false,
  },
  fragments: {
    viewer: (variables) => Relay.QL`
      fragment on Viewer {
        allPosts(first: $pageSize, after: $after) @include(if: $wantNext){
          ${postConnectionFragment}
        }
        allPosts(last: $pageSize, before: $before) @include(if: $wantPrevious) {
          ${postConnectionFragment}
        }
      }
    `
  }
});
