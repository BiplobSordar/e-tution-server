
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config(); 


const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
if (!saBase64) {
  throw new Error("Missing FIREBASE_SA_BASE64 env var");
}

const saJson = JSON.parse(Buffer.from(saBase64, "base64").toString("utf8"));


admin.initializeApp({
  credential: admin.credential.cert(saJson),
});

export default admin;