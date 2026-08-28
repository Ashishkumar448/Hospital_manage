import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Parse the service account key from the environment variables
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();

export async function POST(request: Request) {
  try {
    // 1. Authenticate the caller to ensure only 'admin' can do this.
    // We would ideally verify the authorization header ID token here.
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 2. Extract user data from the request body
    const body = await request.json();
    const { email, password, role, displayName } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    // 4. Assign the requested Custom Claim (RBAC)
    await auth.setCustomUserClaims(userRecord.uid, { role });

    return NextResponse.json(
      { message: "User created successfully", uid: userRecord.uid },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
