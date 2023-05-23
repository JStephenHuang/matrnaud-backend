import { Router } from "express";
import { storage, firestore } from "firebase-admin";
import { Photo } from "../types/types";
import multer, { memoryStorage } from "multer";

const router = Router();

const upload = multer({ storage: memoryStorage() });

// ! GET all gallery photo

router.get("/", async (req, res) => {
  const db = firestore();

  const mainPhotos = await db
    .collection("main-photos")
    .get()
    .catch((error) => {
      console.log(error);
    });

  if (!mainPhotos)
    return res
      .status(400)
      .send("Database error: columns collection do not exist.");

  return res.status(200).json(mainPhotos.docs.map((photo) => photo.data()));
});

// ! GET a photo by ID

router.get("/:photoId", async (req, res) => {
  const db = firestore();
  const photoId = req.params.photoId;

  const photo = await db
    .collection("main-photos")
    .doc(photoId)
    .get()
    .catch((error) => {
      console.log(error);
    });

  if (!photo)
    return res
      .status(400)
      .send("Database error: columns collection do not exist.");

  return res.status(200).send(photo.data());
});

// ! POST a photo

router.post("/", upload.single("photo"), async (req, res) => {
  const bucket = storage().bucket();
  const db = firestore();

  if (req.file === undefined) return res.status(400).send("No file.");

  // * Firebase storage

  const fileId = `photo-${crypto.randomUUID()}`;

  const buffer = req.file.buffer;
  const file = bucket.file(fileId);
  await file.save(buffer).catch((error) => console.log(error));
  await file.makePublic();
  const path = file.publicUrl();

  const photo = {
    id: fileId,
    title: "",
    description: "",
    mainPhoto: path,
    popularity: 0,
    active: false,
    price: 0,
    photoshoot: [],
  };

  await db
    .collection("main-photos")
    .doc(fileId)
    .set(photo)
    .catch((error) => console.log(error));

  const mainPhotosCollection = await db
    .collection("main-photos")
    .get()
    .catch((error) => {
      console.log(error);
    });

  if (!mainPhotosCollection)
    return res
      .status(400)
      .send("Database error: main-photos collection do not exist.");

  return res
    .status(200)
    .send(mainPhotosCollection.docs.map((photo) => photo.data()));
});

// ! POST multiple photo for photoshoot

router.post("/:photoId", upload.array("photos"), async (req, res) => {
  const bucket = storage().bucket();
  const db = firestore();

  if (req.files === undefined) return res.status(400).send("No files.");

  const files = req.files as Express.Multer.File[];

  const photoId = req.params.photoId;

  const addedPhotoshoot = [];

  for (const file of files) {
    const fileId = crypto.randomUUID();

    const bucketFile = bucket.file(fileId);
    await bucketFile.save(file.buffer);
    await bucketFile.makePublic();
    const path = bucketFile.publicUrl();

    addedPhotoshoot.push({ id: fileId, url: path });
  }

  const photoRef = db.collection("main-photos").doc(photoId);

  const doc = await photoRef.get();

  if (!doc.exists)
    return res.status(400).send("Database error: photo does not exist.");

  const photo = doc.data() as Photo;

  const photoshoot = photo.photoshoot;

  const finalPhotoshoot = photoshoot.concat(addedPhotoshoot);

  await photoRef.update({ photoshoot: finalPhotoshoot });

  return res.status(200).send((await photoRef.get()).data());
});

// ! DELETE a photo to a photoshoot

router.put("/:photoId/:photoshootPhotoId", async (req, res) => {
  const bucket = storage().bucket();
  const db = firestore();

  const photoId = req.params.photoId;
  const photoshootPhototId = req.params.photoshootPhotoId;

  const photoRef = db.collection("main-photos").doc(photoId);

  if (!photoRef)
    return res.status(400).send("Database error: photo does not exist.");

  const photo = (await photoRef.get()).data();

  if (!photo)
    return res.status(400).send("Database error: photo does not exist.");

  const file = bucket.file(photoshootPhototId);
  await file.delete().catch((error) => console.log(error));

  const photoshoot = photo.photoshoot;
  const photoshootId: string[] = photo.photoshoot.map(
    (photoshootPhoto: { id: string; url: string }) => photoshootPhoto.id
  );

  photoshoot.splice(photoshootId.indexOf(photoshootPhototId), 1);

  await photoRef
    .update({ photoshoot: photoshoot })
    .catch((error) => console.log(error));

  return res.status(200).send(photo);
});

// ! PUT photo fields

router.put("/:photoId", async (req, res) => {
  const db = firestore();

  const photoId = req.params.photoId;

  const editedPhoto = req.body.photo as Photo;

  const photoRef = db.collection("main-photos").doc(photoId);

  if (!photoRef)
    return res.status(400).send("Database error: photo does not exist.");

  await photoRef.update({
    title: editedPhoto.title,
    description: editedPhoto.description,
    popularity: Number(editedPhoto.popularity),
    active: editedPhoto.active,
    price: Number(editedPhoto.price),
  });

  const photo = await photoRef.get();

  if (!photo.exists)
    return res.status(400).send("Database error: photo does not exist.");

  return res.status(200).send(photo.data());
});

// ! DELETE a photo by ID

router.delete("/:photoId", async (req, res) => {
  const bucket = storage().bucket();
  const db = firestore();

  const phototId = req.params.photoId;

  const photoRef = db.collection("main-photos").doc(phototId);

  const doc = await photoRef.get();

  if (!doc.exists)
    return res.status(400).send("Database error: photo does not exist.");

  const photo = doc.data() as Photo;

  for (const photoshootPhoto of photo.photoshoot) {
    const file = bucket.file(photoshootPhoto.id);
    await file.delete().catch((error) => console.log(error));
  }

  const file = bucket.file(photo.id);
  await file.delete().catch((error) => console.log(error));
  await photoRef.delete().catch((error) => console.log(error));

  const mainPhotosCollection = await db
    .collection("main-photos")
    .get()
    .catch((error) => {
      console.log(error);
    });

  if (!mainPhotosCollection)
    return res
      .status(400)
      .send("Database error: main-photos collection do not exist.");

  return res
    .status(200)
    .send(mainPhotosCollection.docs.map((photo) => photo.data()));
});

export { router };
