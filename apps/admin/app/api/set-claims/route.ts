import { NextResponse } from 'next/server';
import { adminAuth } from '@repo/firebase/admin';


export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }
    
    // Verify the caller's token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if the caller is actually an admin
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Requires admin role' }, { status: 403 });
    }

    const body = await request.json();
    const { uid, role, department, ward } = body;

    if (!uid || !role) {
      return NextResponse.json({ error: 'Missing uid or role' }, { status: 400 });
    }

    const claims: Record<string, any> = { role };
    if (department) claims.department = department;
    if (ward) claims.ward = ward;

    await adminAuth.setCustomUserClaims(uid, claims);

    return NextResponse.json({ success: true, message: `Claims set for user ${uid}` });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
