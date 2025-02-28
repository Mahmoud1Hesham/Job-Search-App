import { userModel } from "../../../DB/models/User.model.js";
import { companyModel } from "../../../DB/models/Company.model.js";
import * as dbService from "../../../DB/db.service.js";

export const adminDashboardResolver = {
    adminDashboard: async () => {
        const users = await dbService.findAll({ model: userModel });
        const companies = await dbService.findAll({ model: companyModel });

        const transformedUsers = users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        }));

        const transformedCompanies = companies.map(company => ({
            id: company._id,
            companyName: company.companyName,
            companyEmail: company.companyEmail,
            approvedByAdmin: company.approvedByAdmin,
            bannedAt: company.bannedAt ? company.bannedAt.toISOString() : null
        }));

        return {
            users: transformedUsers,
            companies: transformedCompanies
        };
    },
    banOrUnBanUser: async (_, { userId, ban }) => {
        if (typeof ban !== "boolean") {
            throw new Error("Ban flag must be a boolean");
        }

        const data = ban ? { bannedAt: new Date().toISOString() } : { $unset: { bannedAt: "" } };

        const updatedUser = await dbService.findOneAndUpdate({
            model: userModel,
            filter: { _id: userId },
            data,
            options: { new: true }
        });

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    },

    banOrUnBanCompany: async (_, { companyId, ban }) => {
        if (typeof ban !== "boolean") {
            throw new Error("Ban flag must be a boolean");
        }

        const data = ban ? { bannedAt: new Date().toISOString() } : { $unset: { bannedAt: "" } };

        const updatedCompany = await dbService.findOneAndUpdate({
            model: companyModel,
            filter: { _id: companyId },
            data,
            options: { new: true }
        });

        if (!updatedCompany) {
            throw new Error("Company not found");
        }

        return updatedCompany;
    },
    approveCompany: async (_, { companyId }) => {
        const updatedCompany = await dbService.findOneAndUpdate({
            model: companyModel,
            filter: { _id: companyId },
            data: { approvedByAdmin: true },
            options: { new: true }
        });
        if (!updatedCompany) {
            throw new Error("Company not found");
        }
        return updatedCompany;
    }
};
