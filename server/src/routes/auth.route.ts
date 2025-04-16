import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  googleLoginCallback,
  loginController,
  logOutController,
  registerUserController,
} from "../controllers/auth.controller";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;
const authRoute = Router();

authRoute.post("/register", registerUserController);
authRoute.post("/login", loginController);
authRoute.post("/logout", logOutController);

authRoute.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    // Tell Passport not to use sessions (like cookies) to store login data. default is true
    // session: false,
  })
);
authRoute.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
  }),
  googleLoginCallback
);

export default authRoute;
