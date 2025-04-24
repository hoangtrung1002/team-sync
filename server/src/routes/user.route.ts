import { Router } from "express";
import { getCurrentUserController } from "../controllers/user.controller";

const userRoute = Router();

userRoute.get("/", getCurrentUserController);

export default userRoute;
