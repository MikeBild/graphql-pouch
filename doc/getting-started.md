# Getting started

* Define your GraphQL schema in shorthand notation
* Migrate your schema definition into GraphQL-Pouch
* Start GraphQL-Pouch and navigate to the URL printed to your console
* Fetching data using GraphQL Query
* Adding data using GraphQL Mutation


## Define your Schema

GraphQL-Pouch uses the

Let's start with the simplest possible thing. Open a new file name it `gettingstarted.graphql` and enter:

```
type Post {
  # Document key
  id: ID
  # Document revision
  rev: String
  # The fullname of the user
  name: String
}
```

The specific shorthand notation specs that GraphQL-Pouch uses are:

* [GraphQL Schema Language Cheat Sheet](https://github.com/sogko/graphql-schema-language-cheat-sheet)
* [Basics and examples of GraphQL Schema Language](https://wehavefaces.net/graphql-shorthand-notation-cheatsheet-17cd715861b6)
* [Official documentation on GraphQL Type System](http://graphql.org/docs/typesystem/)
* [Draft RFC Specification for GraphQL](https://facebook.github.io/graphql/)

## Migrate into GraphQL-Pouch

```bash
graphql-pouch --schema gettingstarted.graphql
```

## Start GraphQL-Pouch

```bash
graphql-pouch --development
```

Navigate to the URL printed to your console. Now playing with the awesome GraphiQL UI for development.

## GraphQL Query

Enter the following to __Fetch all posts__
```
{
  allPosts {
    id
    rev
    name
  }
}
```

## GraphQL Mutation

Time to add some data.

__Upsert mutation with a specific ID__
```
mutation {
  upsertPost(input: {id: "lskywalker", name: "Luke Skywalker"}) {
    upsertedPostId
    post {
      id
      rev
      name
    }
  }
}
```

## GraphQL Query

__Fetch post by id__
```
{
  post(id: "lskywalker") {
    id
    rev
    name
  }
}
```
