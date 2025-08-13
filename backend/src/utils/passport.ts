import passport from "passport";
import { Profile, Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import userModel from "../models/userModel";

dotenv.config();

// Only initialize Google OAuth if environment variables are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let user = await userModel.findOne({ email });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          } else {
            const newUser = new userModel({
              name: profile.displayName,
              email,
              googleId: profile.id,
            });

            await newUser.save();
            return done(null, newUser);
          }
        } catch (error) {
          console.error("Google Auth Error:", error);
          return done(error);
        }
      }
    )
  );
  console.log("Google OAuth strategy initialized successfully");
} else {
  console.warn("Google OAuth environment variables not found. Google authentication will be disabled.");
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  userModel
    .findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

export default passport;
