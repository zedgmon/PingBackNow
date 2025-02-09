import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import sgMail from "@sendgrid/mail";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken() {
  return randomBytes(32).toString("hex");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;

  const msg = {
    to: email,
    from: "noreply@sendbacknow.com",
    subject: "Verify Your Account - SendBackNow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SendBackNow!</h2>
        <p>Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase());
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          if (!user.emailVerified) {
            return done(null, false, { message: "Please verify your email before logging in" });
          }

          if (!(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const verificationToken = generateToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      const user = await storage.createUser({
        ...req.body,
        email: req.body.email.toLowerCase(),
        password: await hashPassword(req.body.password),
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        emailVerified: false,
      });

      await sendVerificationEmail(user.email, verificationToken);

      res.status(201).json({ 
        message: "Registration successful. Please check your email to verify your account." 
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(400).json({ message: info.message });

      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      await storage.verifyEmail(user.id);
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error verifying email" });
    }
  });

  app.post("/api/resend-verification", async (req, res) => {
    try {
      const schema = z.object({ email: z.string().email() });
      const { email } = schema.parse(req.body);

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      const verificationToken = generateToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      await storage.updateVerificationToken(user.id, verificationToken, tokenExpiry);
      await sendVerificationEmail(user.email, verificationToken);

      res.json({ message: "Verification email sent" });
    } catch (error) {
      res.status(500).json({ message: "Error sending verification email" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}