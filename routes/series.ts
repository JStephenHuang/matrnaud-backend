import { Router } from "express";
import { storage, firestore } from "firebase-admin";
import { Frame, Series } from "../types/types";
import multer, { memoryStorage } from "multer";

const router = Router();

const upload = multer({ storage: memoryStorage() });

router.get("/", async (req, res) => {
  const db = firestore();

  const series = await db.collection("series").get();

  if (!series)
    return res
      .status(400)
      .send("Database error: columns collection do not exist.");

  return res.status(200).send(series.docs.map((serie) => serie.data()));
});

router.get("/active", async (req, res) => {
  const db = firestore();

  const seriesRef = db.collection("series");

  const snapshotSerie = await seriesRef.where("active", "==", true).get();

  if (snapshotSerie.empty) {
    return res.status(200).send("No matching documents.");
  }

  const activeSerie = snapshotSerie.docs.map((series) => series.data())[0];

  const snapshotFrames = await db
    .collection("frames")
    .where("seriesId", "==", activeSerie.id)
    .get();

  if (snapshotFrames.empty) {
    return res.status(200).send("No matching documents.");
  }

  return res.status(200).send({
    series: activeSerie,
    frames: snapshotFrames.docs.map((frames) => frames.data()),
  });
});

router.get("/:seriesId", async (req, res) => {
  const db = firestore();

  const seriesId = req.params.seriesId;

  const series = await db.collection("series").doc(seriesId).get();

  const snapshot = await db
    .collection("frames")
    .where("seriesId", "==", seriesId)
    .get();

  if (!series)
    return res
      .status(400)
      .send("Database error: series collection do not exist.");

  return res.status(200).send({
    series: series.data(),
    frames: snapshot.docs.map((frame) => frame.data()),
  });
});

router.post("/", async (req, res) => {
  const db = firestore();

  const seriesId = `series-${crypto.randomUUID()}`;

  const series = {
    id: seriesId,
    title: "",
    startDate: "",
    endDate: "",
    frames: [],
    active: false,
  };

  await db.collection("series").doc(seriesId).set(series);

  const seriesCollection = await db.collection("series").get();

  if (!seriesCollection)
    return res
      .status(400)
      .send("Database error: main-photos collection do not exist.");

  return res.status(200).send(seriesId);
});

router.put("/:seriesId", async (req, res) => {
  const db = firestore();

  const seriesId = req.params.seriesId;

  const editedSeries = req.body.series as Series;

  const seriesRef = db.collection("series").doc(seriesId);

  await seriesRef.update({
    title: editedSeries.title,
    startDate: editedSeries.startDate,
    endDate: editedSeries.endDate,
    active: editedSeries.active,
  });

  const series = await seriesRef.get();

  if (!series.exists)
    return res.status(400).send("Database error: series does not exist.");

  return res.status(200).send(series.data());
});

// ! DELETE a photo by ID

router.delete("/:seriesId", async (req, res) => {
  const bucket = storage().bucket();
  const db = firestore();

  const seriesId = req.params.seriesId;

  const seriesRef = db.collection("series").doc(seriesId);

  const doc = await seriesRef.get();

  if (!doc.exists)
    return res.status(400).send("Database: series does not exist.");

  const series = doc.data() as Series;

  for (const seriesFrame of series.frames) {
    const file = bucket.file(seriesFrame);

    const res = await file.exists();
    console.log(res);
    if (res[0]) {
      await file.delete().catch((error) => console.log(error));
    }
    const frameRef = db.collection("frames").doc(seriesFrame);
    await frameRef.delete();
  }

  await seriesRef.delete().catch((error) => console.log(error));

  const seriesCollection = await db
    .collection("series")
    .get()
    .catch((error) => console.log(error));

  if (!seriesCollection)
    return res
      .status(400)
      .send("Database error: series collection do not exists.");

  return res
    .status(200)
    .send(seriesCollection.docs.map((serie) => serie.data()));
});

export { router };
