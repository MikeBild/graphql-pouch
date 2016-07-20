# GraphQL-Pouch Star-Wars Example

This contains an example GraphQL shorthand notation schema which will work with GraphQL-Pouch.

## Setup

Somehow you need to download this, do it however you like but we’ll go over how to do it with git here.

```bash
git clone https://github.com/MikeBild/graphql-pouch.git
cd graphql-pouch/example/star-wars
```

## Running

Simple enter the following commands in your console.

```bash
npm install
npm run schema
npm start
```

This will run the schema migration on your default schema and start GraphQL-Pouch. Navigate to the URL printed in your console and you see the GraphiQL-UI. Use it to navigate to the documentation for the GraphQL server.

## Sample queries

__Insert with ID__

```graphql
mutation {
  upsertHuman(input: {id: "lskywalker", name: "Luke Skywalker", homePlanet: "Tatooine"}) {
    upsertedHumanId
    human {
      id
      rev
      name
      homePlanet
    }
  }
}
```

__Read by ID__

```graphql
{
  human(id: "lskywalker") {
    id
    rev
    name
    homePlanet
  }
}
```

__Read list of all__

```graphql
{
  allHumans {
    id
    rev
    name
    homePlanet
  }
}
```

__Update by ID__

```graphql
mutation {
  upsertHuman(input: {id: "lskywalker", rev: "your-revision-number" name: "L. Skywalker", homePlanet: "Tatooine"}) {
    upsertedHumanId
    human {
      id
      rev
      name
      homePlanet
    }
  }
}
```

__Deletes by ID__

```graphql
mutation {
  deleteHuman(id:"lskywalker"){
    deletedHumanId
    human {
      id
      rev
      name
      homePlanet
    }
  }
}
```
