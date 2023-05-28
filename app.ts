import admin from "firebase-admin";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { router as emailRouter } from "./routes/email";
import express from "express";
import { router as framesRouter } from "./routes/frames";
import { isAuthenticated } from "./middlewares/isAuthenticated";
import { router as photoRouter } from "./routes/photos";
import { router as seriesRouter } from "./routes/series";
import { router as stripeRouter } from "./stripe/stripe";

const app = express();

dotenv.config();

app.use(cors({ origin: process.env.ADMIN_URL, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT as string);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: "https://matrnaud-default-rtdb.firebaseio.com/",
  storageBucket: "matrnaud.appspot.com",
});

app.use("/api/photos", photoRouter);
app.use("/api/series", seriesRouter);
app.use("/api/frames", framesRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/email", emailRouter);

app.post("/api/login", isAuthenticated, (req, res) => {
  res.status(200).send("Cookie set");
});

app.post("/api/auth", isAuthenticated, (req, res) => {
  res.status(200).send("Authenticated");
});

export default app;
