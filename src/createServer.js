const { GraphQLServer } = require("graphql-yoga");

const Mutation = require("./resolvers/Mutation");
const Query = require("./resolvers/Query");
const db = require("./db");

function createServer() {
  return new GraphQLServer({
    typeDefs: "src/schema.graphql",
    resolvers: {
      Query,
      Mutation,
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    playground: {
      settings: {
        // include cookies in the requests from the GraphQL playground
        "request.credentials": "include",
      },
    },
    context: (req) => ({
      ...req,
      db,
    }),
  });
}

module.exports = createServer;
