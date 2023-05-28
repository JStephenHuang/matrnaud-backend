import { NextFunction, Request, Response } from "express";

import dotenv from "dotenv";

dotenv.config();

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (authHeader === undefined) return res.status(401).send("Unauthorized 1");
  const credential = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString() //username:password
    .split(":"); // [username, password]

  console.log(credential);
  const username = credential[0];
  const password = credential[1];

  if (username !== (process.env.USERNAME as string))
    return res.status(401).send("Unauthorized 2");
  if (password !== (process.env.PASSWORD as string))
    return res.status(401).send("Unauthorized 3");

  return next();
};
