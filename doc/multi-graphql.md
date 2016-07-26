# Multiple GraphQL Schemas

GraphQL-Pouch wants to combine flexible development with the stability of specifications and the simplicity of standard libraries. Useful in practice - multiple schemas can help offering alternative GraphQL specifications, and of course implementations, without starting new instances.

GraphQL-Pouch starts initially with a default schema `default.graphql` for administration. To setup your own project specific shorthand GraphQL schema simply do the following:

```bash
graphql-pouch --schema <my-schema-filename.graphql>
```

The filename `my-schema-filename.graphql` registers a new GraphQL schema named `my-schema-filename` which is available via the URL printed to your console at your next run `graphql-pouch --development`.
