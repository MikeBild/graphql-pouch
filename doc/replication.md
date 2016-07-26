# Master/Master Replication

GraphQL-Pouch is completely self contained and designed to comfortable develop web and mobile frontends in a single or distributed node environment. Started by a simple "offline enabled" development environment, up to multiple high avalabile running instances behind a load balancer or reverse proxy. Shared data between multiple instances of an application has many tradeoffs. Rather than relying on a master/slave or cluster systems as a "single source of truth", GraphQL-Pouch supports PouchDB-CouchDB's multi-master node replication. In a multi-node architecture GraphQL-Pouch is partitioned, every node is available, and it's only eventually consistent. This behavior is intentional to build responsible user interfaces with a smooth user experience all the time. Especially Relay has an integrated mechanism named [Relay Optimistic Updates](https://facebook.github.io/relay/docs/guides-mutations.html#optimistic-updates) to handle eventual consistency in a particularly nice way. Try to build your frontend data manipulations with this idea in mind.

For further information read:

* [Eventual Consistency](http://docs.couchdb.org/en/1.6.1/intro/consistency.html)
* [PouchDB Replication Guide](https://pouchdb.com/guides/replication.html)
* [CouchDB Replication Intro](http://docs.couchdb.org/en/1.6.1/replication/intro.html)

## Enable synchronisation

```bash
graphql-pouch --remote http://username:password@mycouch.example.com/<DB-prefix>
```
