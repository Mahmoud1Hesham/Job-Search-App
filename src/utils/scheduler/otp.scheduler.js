import cron from "node-cron";
import { deleteExpiredOTPs } from "../../modules/auth/services/registration.service.js";

let cronSchedule = "*/10 * * * *"; 

const startCronJob = (expiryDuration = 20, customSchedule = null) => {
    const schedule = customSchedule || cronSchedule;

    console.log(`🚀 Starting Cron Job with schedule: ${schedule}, Expiry Duration: ${expiryDuration} mins`);

    cron.schedule(schedule, () => {
        deleteExpiredOTPs(expiryDuration);
    });
};

startCronJob(_,'0 */6 * * *');

// setTimeout(() => {
//     console.log("🔄 Changing cron job schedule to run every 5 minutes...");
//     startCronJob(20, "*/5 * * * *");
// }, 30000); 
