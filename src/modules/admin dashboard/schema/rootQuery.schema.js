import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { adminDashboardResolver } from "../resolvers/adminDashboard.resolver.js";
import { AdminDashboardDataType, AdminMutations } from "./admin.schema.js";


const RootQuery = new GraphQLObjectType({
    name: "Query",
    fields: {
        adminDashboard: {
            type: AdminDashboardDataType,
            resolve: adminDashboardResolver.adminDashboard
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        ...AdminMutations
    }
});

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});

export default schema;