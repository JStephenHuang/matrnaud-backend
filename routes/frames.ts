import { Router } from "express";
import { firestore, storage } from "firebase-admin";
import { Frame, Series } from "../types/types";
import multer, { memoryStorage } from "multer";

const router = Router();

const upload = multer({ storage: memoryStorage() });

router.get("/:frameId", async (req, res) => {
  const db = firestore();

  const frameId = req.params.frameId;

  const doc = await db.collection("frames").doc(frameId).get();

  if (!doc.exists)
    return res.status(400).send("DB error: frame does not exist.");

  return res.status(200).send(doc.data());
});

router.post("/:seriesId", upload.single("photo"), async (req, res) => {
  const db = firestore();
  const bucket = storage().bucket();

  if (!req.file) return res.status(400).send("No file.");

  const seriesId = req.params.seriesId;

  const frameId = `frame-${crypto.randomUUID()}`;

  const buffer = req.file.buffer;
  const file = bucket.file(frameId);
  await file.save(buffer).catch((error) => console.log(error));
  await file.makePublic();
  const path = file.publicUrl();

  const frame = {
    id: frameId,
    seriesId: seriesId,
    title: "",
    price: 0,
    url: path,
  };

  await db.collection("frames").doc(frameId).set(frame);

  const seriesRef = db.collection("series").doc(seriesId);

  const doc = await seriesRef.get();
  if (!doc.exists)
    return res.status(400).send("Database error: series does not exist.");

  const series = doc.data() as Series;
  const frames = series.frames;
  frames.push(frameId);
  await seriesRef.update({ frames: frames });

  const frameRef = await db
    .collection("frames")
    .where("seriesId", "==", seriesId)
    .get();

  return res.status(200).send(frameRef.docs.map((frame) => frame.data()));
});

router.put("/:frameId", async (req, res) => {
  const db = firestore();

  const frameId = req.params.frameId;
  const editedFrame = req.body.frame as Frame;

  const frameRef = db.collection("frames").doc(frameId);

  await frameRef.update({
    title: editedFrame.title,
    price: editedFrame.price,
  });

  const frame = await frameRef.get();

  if (!frame.exists)
    return res.status(400).send("Database error: frame does not exist.");

  return res.status(200).send(frame.data());
});

router.delete("/:frameId", async (req, res) => {
  const db = firestore();
  const bucket = storage().bucket();

  const frameId = req.params.frameId;

  const frameRef = db.collection("frames").doc(frameId);

  const frameDoc = await frameRef.get();

  if (!frameDoc.exists)
    return res.status(400).send("Database error: frame does not exist.");

  const frame = frameDoc.data() as Frame;

  const file = bucket.file(frame.id);
  const exist = (await file.exists())[0];
  if (exist) {
    await file.delete();
  }

  const seriesRef = db.collection("series").doc(frame.seriesId);

  const seriesDoc = await seriesRef.get();

  if (!seriesDoc.exists)
    return res.status(400).send("Database error: series does not exist.");

  const series = seriesDoc.data() as Series;

  const frames = series.frames;

  await seriesRef.update({
    frames: frames.filter((frame) => {
      return frame !== frameId;
    }),
  });

  await frameRef.delete();

  const snapshot = await db
    .collection("frames")
    .where("seriesId", "==", series.id)
    .get();

  return res.status(200).send(snapshot.docs.map((frame) => frame.data()));
});

export { router };
