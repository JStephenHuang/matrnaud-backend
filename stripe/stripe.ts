import { Frame } from "../types/types";
import { Router } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const router = Router();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//   apiVersion: "2022-11-15",
// });

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

router.post("/checkout", async (req, res) => {
  const { form, frame } = req.body;

  console.log(form);

  const emailTemplate = {
    to: "matiasrenaud04@gmail.com",
    from: "matrnaudphotos@gmail.com",
    subject: `${form.name} is interested in buying ${frame.title}.`,
    html: `
    <p><strong>From: </strong>${form.name}, ${form.email}</p>
    <p><strong>${frame.title}</strong> for <strong>CAD$ ${frame.price}</strong> is up for a purchase.<p>
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

  // const item = req.body.item as Frame;
  // const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
  //   {
  //     price_data: {
  //       currency: "cad",
  //       product_data: {
  //         name: `${item.title} Frame`,
  //         images: [item.url],
  //       },
  //       unit_amount_decimal: item.price.replace(/\./g, ""),
  //     },
  //     quantity: 1,
  //   },
  // ];
  // const session = await stripe.checkout.sessions.create({
  //   line_items: line_items,
  //   payment_method_types: ["card"],
  //   mode: "payment",
  //   success_url: `${process.env.CLIENT_URL}?success=true`,
  //   cancel_url: `${process.env.CLIENT_URL}?canceled=true`,
  // });
  // return res.status(200).send({ url: session.url });
});

export { router };
