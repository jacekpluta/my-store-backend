const { GraphQLServer } = require("graphql-yoga");

// import { loadSchemaSync } from '@graphql-tools/load';
// import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
// import { addResolversToSchema } from '@graphql-tools/schema';

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
    context: (req) => ({
      ...req,
      db,
    }),
  });
}

module.exports = createServer;
