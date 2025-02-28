import { GraphQLBoolean, GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { adminDashboardResolver } from "../resolvers/adminDashboard.resolver.js";




export const UserType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        email: { type: GraphQLString },
        role: { type: GraphQLString }
    })
});

export const CompanyType = new GraphQLObjectType({
    name: "Company",
    fields: () => ({
        id: { type: GraphQLID },
        companyName: { type: GraphQLString },
        companyEmail: { type: GraphQLString },
        approvedByAdmin: { type: GraphQLBoolean },
        bannedAt: { type: GraphQLString }
    })
});

export const AdminDashboardDataType = new GraphQLObjectType({
    name: "AdminDashboardData",
    fields: () => ({
        users: { type: new GraphQLList(UserType) },
        companies: { type: new GraphQLList(CompanyType) }
    })
});

export const AdminMutations = {
    banOrUnBanUser: {
        type: UserType,
        args: {
            userId: { type: GraphQLID },
            ban: { type: GraphQLBoolean }
        },
        resolve: adminDashboardResolver.banOrUnBanUser
    },
    banOrUnBanCompany: {
        type: CompanyType,
        args: {
            companyId: { type: GraphQLID },
            ban: { type: GraphQLBoolean }
        },
        resolve: adminDashboardResolver.banOrUnBanCompany
    },
    approveCompany: {
        type: CompanyType,
        args: {
            companyId: { type: GraphQLID }
        },
        resolve: adminDashboardResolver.approveCompany 
    },
};