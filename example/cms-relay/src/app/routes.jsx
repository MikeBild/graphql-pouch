import React from 'react';
import Relay from 'react-relay';
import { Route, IndexRedirect } from 'react-router';
import App from './components/App';
import Loading from './components/Loading';
import Error from './components/Error';
import PostList from './components/PostList';
import PostItem from './components/PostItem';
import PostCreate from './components/PostCreate';
import PostUpdate from './components/PostUpdate';
import PostDelete from './components/PostDelete';

const ViewerQueries = {
  viewer: () => Relay.QL`query { viewer }`,
};

const PostQueries = {
  viewer: () => Relay.QL`query { viewer }`,
  post: () => Relay.QL`query { post(id: $id) }`
};

function loader(ctx) {
  if(ctx.error) return <Error />;
  return ctx.props ? React.cloneElement(ctx.element, ctx.props) : <Loading />;
}

export default (
  <Route path='/' component={App} >
    <IndexRedirect to='posts' />
    <Route path='posts' component={PostList} queries={ViewerQueries} render={loader} />
    <Route path='posts/create' component={PostCreate} queries={ViewerQueries} render={loader} />
    <Route path='posts/update/:id' component={PostUpdate} queries={PostQueries} render={loader} />
    <Route path='posts/delete/:id' component={PostDelete} queries={PostQueries} render={loader} />
    <Route path='posts/:id' component={PostItem} queries={PostQueries} render={loader} />
  </Route>
);
