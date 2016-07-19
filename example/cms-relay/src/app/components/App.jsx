import React from 'react';
import Relay from 'react-relay';
import { Link } from 'react-router';

export default class App extends React.Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-default navbar-fixed-top">
          <div className="container">
            <div className="navbar-header">
              <Link to="/" className="navbar-brand">GraphQL Example</Link>
            </div>

            <ul className="nav navbar-nav navbar-right">
              <li><Link to="/">Dashboard</Link></li>
              <li className="dropdown">
                <a href="/" className="dropdown-toggle" data-toggle="dropdown">Links <span className="caret"></span></a>
                <ul className="dropdown-menu">
                  <li><Link to="/posts/create">Create a Post</Link></li>
                  <li role="separator" className="divider"></li>
                  <li><Link to="/about">About</Link></li>
                </ul>
              </li>
            </ul>
          </div>
        </nav>
        <br /><br /><br />
        <div className="container">
          {this.props.children}
        </div>
      </div>
    );
  }
}
