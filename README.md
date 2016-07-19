# GraphQL-API runtime on top of PouchDB

*A GraphQL-API runtime on top of PouchDB created by GraphQL shorthand notation as a self contained service with CouchDB synchonisation.*

## Usage
First install using npm:

```bash
npm install -g graphql-pouch
```

and then just run it!

```bash
graphql-pouch
```

For more information run:

```bash
graphql-pouch -h
```

##GraphiQL UI for development becomes standard

[GraphiQL](https://github.com/graphql/graphiql) is a awesome web based tool by Facebook to let you interactively explore your data and your API. When development mode is enabled in GraphQL-Pouch, the GraphiQL interface will be automatically displayed at your GraphQL endpoint.

__Example__

```bash
graphql-pouch --development
```

```bash
Listen on port 3000
CouchDB sync URL: none
Relay enabled: true
Development mode: true
JWT-Authentication: false

Supported GraphQL schemas:
cms initialized and running - http://127.0.0.1:3000/graphql/cms
```

Navigate to the URL printed to your console after starting GraphQL-Pouch and use GraphiQL to fetch your data. When you want to use GraphQL-Pouch in production mode, the [GraphiQL-App](https://github.com/skevy/graphiql-app) is ideally suited.

## GraphQL and Relay

Check out the [CMS example](https://github.com/MikeBild/graphql-pouch/tree/master/example/cms-relay) for a demo of GraphQL-Pouch, Relay and React in action.

## Benefits

GraphQL-Pouch uses the joint benefits of PouchDB and GraphQL to provide a number of key benefits.

* 100% GraphQL compliant (supports pure GraphQL mode)
* [100% Relay](doc/using-relay.md) compliant
* [Command Line Interface](doc/CLI.md)
* [JWT Authentication support](doc/jwt-authentication.md)
* [Advanced GraphQL-Queries and Mutations](doc/advanced-queries.md) via custom JavaScript functions
* Fully documented GraphQL-APIs via [GraphiQL-UI](https://github.com/graphql/graphiql) for development
* Completely self contained with optional CouchDB Master/Master server syncronisation
* Supports relationships, types, comments, pagination, and more providing by GraphQL, PouchDB and CouchDB
* Serving static files for e.g. React-Application hosting

## Roadmap
In the future, things that GraphQL-Pouch will include:

* HTTPS Support
* Mock/Fake data results
* Runtime traceability using resolver timings
* Role base authorization
* GraphQL-Pouch as a library
* MongoDB query language inspired subselections
* DataLoader for batching and caching optimization
* Subscriptions using PouchDB change notifications

and, of course:

* better documentation
* better validation and error messages
* better debug logs
* more tests
* more examples

## Run Tests

```
npm install
npm test
```

## Development

```
npm run dev
```

## Contributors
Check them out [here](https://github.com/MikeBild/graphql-pouch/graphs/contributors)

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public [GitHub issue tracker](https://github.com/MikeBild/graphql-pouch/issues).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

## Thanks

You like this GraphQL server and you want to see what coming next? Follow me on Twitter [`@mikebild`](https://twitter.com/mikebild).

Enjoy!

## Credits

Thanks to [Matthew Mueller](https://github.com/matthewmueller) for his initial work on [graph.ql](https://github.com/matthewmueller/graph.ql) which laid the groundwork for the GraphQL shorthand notation parser module.
