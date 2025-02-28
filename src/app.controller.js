import cors from 'cors'
import helmet from 'helmet';
import DBConnection from './DB/connection.js'
import authController from './modules/auth/auth.controller.js'
import userController from './modules/user/user.controller.js'
import jobController from './modules/job/job.controller.js'
import applicationController from './modules/application/application.controller.js'
import companyController from './modules/company/company.controller.js'
import { globalErrorHandling } from './utils/response/error.response.js';
import { createHandler } from "graphql-http/lib/use/express";
import schema from './modules/admin dashboard/schema/rootQuery.schema.js';
import rateLimit from 'express-rate-limit';


const limiter = rateLimit({
    limit: 10,
    windowMs: 2 * 60 * 1000,
    message: { err: "rete limit reached" },
    statusCode: 429,
    legacyHeaders: true, standardHeaders: 'draft-8'
})

const bootstrap = (app, express) => {
    // convert buffer to json
    app.use(express.json())


    // controlling cors origin
    app.use(cors({ origin: "*" }))
    // helmet
    app.use(helmet())
    // rate limiter
    app.use(limiter)
    // home endpoint
    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Welcome in node.js project powered by express and ES6" })
    })
    // auth apis
    app.use("/auth", authController)
    // user apis
    app.use("/users", userController)
    //company apis
    app.use('/company', companyController)
    //job apis
    app.use('/job', jobController)
    //application apis
    app.use('/application', applicationController)
    //admin dashboard graphql endpoint
    app.use(
        "/graphql",
        createHandler({
            schema,
            context: (req) => ({ authorization: req.headers.authorization })
        })
    );
    // global error handler
    app.use(globalErrorHandling)

    // DB connection function
    DBConnection()
}
export default bootstrap;