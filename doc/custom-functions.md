# Custom Query and Mutation functions

Sometimes it's necessary to extend GraphQL-Pouch's base functionality with your own project specific implementations. There are two different depth levels to enhance GraphQL-Pouch to replace existing or define new queries and mutations.

* [Register custom functions via CLI](#register-custom-functions-via-cli)
* [Use GraphQL-Pouch as a NPM-Module](npm-module.md)

## Register custom functions via CLI

Here is a full example to replace a GrpahQL-Pouch generated Mutation with your own implementation.

* Create or modify your GraphQL-Pouch shorthand notation schema. Skip this if your own schema already exists.

__myschema.graphql__
```graphql
type Service {
  id: ID!
  rev: String
}
```

Register your schema with the `--schema` CLI argument

```bash
graphql-pouch ---schema myschema.graphql
```

* Create a file named by query or mutation you want to support, respectively replace, in your GraphQL-Schema. There is a simple convention for custom function naming:

`operation name` + `type name` + `.js`

For instance: replace the `upsert`-Mutation for the `Service`-Type

 __upsertService.js__
```javascript
module.exports = (ctx, input) => {

  // Build Relay compliant `UpsertSettingPayload` result
  const result = {
    upsertedServiceId: input.input.id,
    clientMutationId: input.input.clientMutationId,
    service: {
      id: input.input.id,
      rev: '',
    },
    serviceEdge: {
      cursor: 0,
      node: {
        id: input.input.id,
        rev: '',
      }
    }
  };

  // Send result to Relay compliant client
  ctx.success(result);
}
```

* Afterward register the function with the `--function` CLI argument.

```bash
graphql-pouch --function upsertService.js
```

* Start `graphql-pouch --development`, navigate to the displayed GraphiQL URL and enter

```graphql
mutation {
  upsertService(input: {id: "my-client-generated-id", clientMutationId: "my-client-generated-id"}) {
    upsertedServiceId
    clientMutationId
    service {
      id
      rev
    }
    serviceEdge {
      cursor
      node {
        id
        rev
      }
    }
  }
}
```
