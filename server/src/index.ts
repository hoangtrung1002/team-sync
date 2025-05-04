import session from "cookie-session";
import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { HTTPSTATUS } from "./config/http.config";
import "./config/passport.config";
import { asyncHandler } from "./middlewares/asynHandler.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { BadRequestException } from "./utils/app-error";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoute from "./routes/workspace.route";
import memberRoute from "./routes/member.route";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException();
    res.status(HTTPSTATUS.OK).json({ message: "Welcome to the API" });
  })
);
app.use(`${BASE_PATH}/auth`, authRoute);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoute);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoute);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoute);
app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(
    `Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`
  );
  await connectDatabase();
});
