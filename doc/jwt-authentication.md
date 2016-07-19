# Using JWT Authentication

GraphQL-Pouch let’s you use token based authentication with JSON Web Tokens (JWT) to secure your GraphQL-API.

To enable token based authorization use the --secret <string> command line argument with a secure string. GraphQL-Pouch will use to sign and verify tokens. Shoukd you don’t want authorization, don’t set the --secret argument and GraphQL-Pouch will ignore authorization.

__Example__

```bash
graphql-pouch --secret mysupersecret
```

## Sign a JSON Web Token

To create and sign a token, just use the --sign <string> command line argument. You get back a token and their use within a client.

__Example__

```bash
graphql-pouch --sign mysupersecret
```

```
------------------- as HTTP Header --------------------
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE0Njg5NTA5OTAsImF1ZCI6ImdyYXBocWwtcG91Y2gifQ.kznTAFKkBvKDM7GgQ-ltHx6Go-XsN_RgkoKh_G6hXr0

--------------- or as Query Parameter ---------------
?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE0Njg5NTA5OTAsImF1ZCI6ImdyYXBocWwtcG91Y2gifQ.kznTAFKkBvKDM7GgQ-ltHx6Go-XsN_RgkoKh_G6hXr0
```
