import { Router } from "express";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

const router = Router();

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

router.post("/", async (req, res) => {
  const form = req.body;

  const emailTemplate = {
    to: "matiasrenaud04@gmail.com",
    from: "matrnaudphotos@gmail.com",
    subject: `Booking request from ${form.name}`,
    html: `
      <p><strong>From: </strong>${form.name}, ${form.email}</p>
      <p>${form.message}</p>`,
  };

  const sending = await sgMail.send(emailTemplate).catch((error) => {
    return res
      .status(200)
      .send({ status: "Error", message: "Email not sent.", error: error });
  });

  if (sending) {
    return res.status(200).send({ status: "Success", message: "Email sent." });
  }
});

export { router };
