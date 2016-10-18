import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';
import { Router, browserHistory, applyRouterMiddleware } from 'react-router';
import useRelay from 'react-router-relay';
import routes from './routes';
import RelaySubscriptions from 'relay-subscriptions';
import NetworkLayer from './NetworkLayer';

const environment = new RelaySubscriptions.Environment();
environment.injectNetworkLayer(new NetworkLayer(window.__env.ENDPOINT));

ReactDOM.render(
  <Router
    history={browserHistory}
    routes={routes}
    render={applyRouterMiddleware(useRelay)}
    environment={environment}
  />,
  document.getElementById('render_body')
);
