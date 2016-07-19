# Command Line Interface

## Start GraphQL-Server (default port 3000)

```bash
graphql-pouch
```

## Set HTTP port

```bash
graphql-pouch --port 3000
```

## Show CLI help

```bash
graphql-pouch --help
```

## Enable JWT Authentication

```bash
graphql-pouch --string <string>
```

## Enable GraphiQL, pretty print, debug development mode

```bash
graphql-pouch --development
```

## Sync data with a CouchDB/PouchDB URL

```bash
graphql-pouch --remote http://username:password@mycouch.example.com
```

## Show current version

```bash
graphql-pouch --version
```

## Disable GraphQL-Relay extentions

```bash
graphql-pouch --no-relay
```

## Sign a JWT token

```bash
graphql-pouch --sign <string>
```

## Migrate a GraphQL-Schema file

```bash
graphql-pouch --graphql <filename>
```

## Migrate a custom JS function file

```bash
graphql-pouch --function <filename>
```

## Migrate a static content file

```bash
graphql-pouch --static <filename>
```
