# Command Line Interface

## Start GraphQL-Server (default port 3000)

```bash
graphql-pouch
```

```bash
graphql-pouch -p 8080
```
## Enable JWT Authentication

```bash
graphql-pouch -a <secret>
```

## Sync data with a CouchDB/PouchDB URL

```bash
graphql-pouch -r http://username:password@mycouch.example.com
```

## Show CLI help

```bash
graphql-pouch -h
```

## Show current version

```bash
graphql-pouch -V
```

## Disable GraphQL-Relay extentions

```bash
graphql-pouch -e
```

## Migrate a GraphQL-Schema file

```bash
graphql-pouch -g <filename>
```

## Migrate a Lambda-Function file

```bash
graphql-pouch -l <filename>
```

## Migrate a static content file

```bash
graphql-pouch -s <filename>
```

## Sign a JWT token

```bash
graphql-pouch -y <secret>
```