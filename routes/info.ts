import { Router } from "express";
import { firestore } from "firebase-admin";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

router.get("/", async (req, res) => {
  const db = firestore();

  const infoCollection = db.collection("info");

  return res.status(200).send({
    bio: (await infoCollection.doc("bio").get()).data(),
    bookingDescription: (
      await infoCollection.doc("booking-description").get()
    ).data(),
  });
});

router.put("/", isAuthenticated, async (req, res) => {
  const db = firestore();
  const { bio, bookingDescription } = req.body;

  console.log(bio, bookingDescription);

  const bioRef = db.collection("info").doc("bio");
  const bookingDescriptionRef = db
    .collection("info")
    .doc("booking-description");

  await bioRef.update({ content: bio });
  await bookingDescriptionRef.update({ content: bookingDescription });

  return res.status(200).send({
    bio: (await bioRef.get()).data(),
    bookingDescription: (await bookingDescriptionRef.get()).data(),
  });
});

export { router };
