# Entity Relationship Diagram

![last version of erd](./prisma/doc/ERD.svg)

## How to generate ?

```sh
curl -X POST -d "$(cat ./prisma/schema.prisma)" -H "Content-Type: text/plain" -o ./prisma/doc/ERD.svg https://p-erd.oxypomme.fr/erd/
```