import { Router } from "express";

import Stripe from "stripe";
import dotenv from "dotenv";
import { Frame } from "../types/types";
import { storage } from "firebase-admin";

dotenv.config();

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

router.post("/api/checkout", async (req, res) => {
  const bucket = storage().bucket();

  const item = req.body.item as Frame;

  const file = bucket.file(item.id);

  const url = await file.getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  });

  console.log(url);

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "cad",
        product_data: {
          name: `${item.title} Frame`,
          images: [item.url],
        },
        unit_amount_decimal: item.price.replace(/\./g, ""),
      },
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    line_items: line_items,
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}?success=true`,
    cancel_url: `${process.env.CLIENT_URL}?canceled=true`,
  });

  return res.status(200).send({ url: session.url });
});

export { router };
