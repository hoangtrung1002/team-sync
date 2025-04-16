import { Request } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { ProviderEnum } from "../enums/account-provider.enum";
import {
  loginInOrCreateAccountService,
  verifyUserService,
} from "../services/auth.service";
import { NotFoundException } from "../utils/app-error";
import { config } from "./app.config";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      passReqToCallback: true, // If true, your callback gets req as the first argument
    },
    async (req: Request, accessToken, refreshToken, profile, done) => {
      try {
        const { email, sub: googleId, picture } = profile._json;
        console.log("profile: ", profile);
        console.log("google: ", googleId);

        if (!googleId) {
          throw new NotFoundException("Google ID is missing");
        }
        const { user } = await loginInOrCreateAccountService({
          provider: ProviderEnum.GOOGLE,
          displayName: profile.displayName,
          providerId: googleId,
          picture: picture,
          email: email,
        });
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: true,
    },
    async (email, password, done) => {
      try {
        const user = await verifyUserService({ email, password });
        return done(null, user);
      } catch (error: any) {
        return done(error, false, { message: error?.message });
      }
    }
  )
);

// Store the user object returned from done(null, user) in the session/cookie
passport.serializeUser((user: any, done) => done(null, user));
/*  
  Takes the session data and query the database to get the user object.
  This is called on every request to check if the user is logged in.
*/
passport.deserializeUser(
  (user: any, done) =>
    done(null, user) /* Call this to attach user info to req.user */
);
