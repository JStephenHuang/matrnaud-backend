import { NextFunction, Request, Response } from "express";

import dotenv from "dotenv";
import { firestore } from "firebase-admin";

dotenv.config();

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (authHeader === undefined) return res.status(401).send("Unauthorized 1");
  const credential = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString() //username:password
    .split(":"); // [username, password]

  const db = firestore();

  const username = credential[0];
  const password = credential[1];

  const snapshot = await db
    .collection("credentials")
    .where("username", "==", username)
    .where("password", "==", password)
    .get();

  if (snapshot.empty) {
    return res.status(401).send("Unauthorized 2");
  }

  return next();
};
