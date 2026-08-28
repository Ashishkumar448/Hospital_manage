import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from the root .env.local file
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();

async function seedAdmin() {
  const email = "admin@test.com";
  const password = "Password12";

  try {
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await auth.getUserByEmail(email);
      console.log(`User ${email} already exists with UID: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create the user
        userRecord = await auth.createUser({
          email: email,
          password: password,
          emailVerified: true,
          displayName: "Super Admin",
        });
        console.log(`Successfully created new user: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Assign custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: "admin" });
    console.log(`Successfully assigned 'admin' role to ${email}`);

  } catch (error) {
    console.error("Error seeding admin:", error);
  }
}

seedAdmin();
