const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: "your-firebase-project-id.appspot.com"
});

const bucket = admin.storage().bucket();


const uploadImageToFirebase = async (base64Data, filename) => {
  const buffer = Buffer.from(base64Data.split(";base64,").pop(), "base64");
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType: "image/jpeg"
    },
    public: true
  });

  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
};
