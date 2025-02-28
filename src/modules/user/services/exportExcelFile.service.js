import { asyncHandler } from "../../../utils/response/error.response.js";
import * as dbService from "../../../DB/db.service.js";
import { applicationModel } from "../../../DB/models/Application.model.js";
import { jobModel } from "../../../DB/models/Job.model.js";
import ExcelJS from "exceljs";

export const exportApplicationsExcel = asyncHandler(async (req, res, next) => {
    const { companyId, date } = req.query;

    if (!companyId || !date) {
        return next(new Error("companyId and date are required", { cause: 400 }));
    }

    const startDate = new Date(date);
    if (isNaN(startDate)) {
        return next(new Error("Invalid date format", { cause: 400 }));
    }
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const jobs = await dbService.findAll({
        model: jobModel,
        filter: {  companyId }
    });
console.log(jobs)
    const jobIds = jobs.map(job => job._id);
    if (!jobIds.length) {
        return next(new Error("No jobs found for this company", { cause: 404 }));
    }

    const applications = await dbService.findAll({
        model: applicationModel,
        filter: {
            jobId: { $in: jobIds },
            createdAt: { $gte: startDate, $lt: endDate }
        }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applications");

    worksheet.columns = [
        { header: "Application ID", key: "id", width: 30 },
        { header: "Job ID", key: "jobId", width: 30 },
        { header: "User ID", key: "userId", width: 30 },
        { header: "Status", key: "status", width: 15 },
        { header: "Applied At", key: "createdAt", width: 25 }
    ];

    applications.forEach(app => {
        worksheet.addRow({
            id: app._id.toString(),
            jobId: app.jobId.toString(),
            userId: app.userId.toString(),
            status: app.status,
            createdAt: app.createdAt.toISOString()
        });
    });

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=applications.xlsx"
    );
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const filePath = `D:/Programming learn/Route Back-End course/Exam-1_jop-search-app/excel files/applications_${companyId}_${date}.xlsx`;
    await workbook.xlsx.writeFile(filePath);
        res.end();
});
