# CMS Example

*A React-Relay CMS UI example using graphql-pouch.*

This contains a complete example of React, Relay and GraphQL shorthand notation schema which will work with GraphQL-Pouch.

## Setup

Somehow you need to download this, do it however you like but we’ll go over how to do it with git here.

```bash
git clone https://github.com/MikeBild/graphql-pouch.git
cd graphql-pouch/example/cms-relay
```

## Running

__First running GraphQL-Pouch__

```bash
npm install
npm run graphql-pouch:schema
npm run graphql-pouch
```

This will run the schema migration on your default schema and start GraphQL-Pouch. Navigate to the URL printed in your console and you see the GraphiQL-UI. Use it to navigate to the documentation for the GraphQL server.

__Second running the React-React Relay application__

```bash
npm start
```

This will run the React-Relay build process and starts a separate server to serve the CMS application for development.
