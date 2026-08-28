import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve('.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    let value = val.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    acc[key] = value.replace(/\\n/g, '\n');
  }
  return acc;
}, {});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
    privateKey: envConfig.FIREBASE_PRIVATE_KEY,
  }),
});

const db = admin.firestore();
const auth = admin.auth();

const usersToSeed = [
  { email: 'admin@citygeneral.org', password: 'Password123!', role: 'admin' },
  { email: 'dr.smith@citygeneral.org', password: 'Password123!', role: 'doctor', department: 'Cardiology' },
  { email: 'dr.jones@citygeneral.org', password: 'Password123!', role: 'doctor', department: 'Paediatrics' },
  { email: 'nurse.mary@citygeneral.org', password: 'Password123!', role: 'staff', ward: 'Gen Ward B' },
  { email: 'exec.john@citygeneral.org', password: 'Password123!', role: 'executive' },
  { email: 'patient.bob@citygeneral.org', password: 'Password123!', role: 'user' },
];

async function seedUsers() {
  for (const u of usersToSeed) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        console.log(`User ${u.email} already exists, updating password and claims...`);
        await auth.updateUser(userRecord.uid, { password: u.password });
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: u.email,
            password: u.password,
            emailVerified: true
          });
          console.log(`Created user ${u.email}`);
        } else {
          throw e;
        }
      }

      const claims = { role: u.role };
      if (u.department) claims.department = u.department;
      if (u.ward) claims.ward = u.ward;

      await auth.setCustomUserClaims(userRecord.uid, claims);
      console.log(`Set claims for ${u.email}:`, claims);
    } catch (err) {
      console.error(`Failed to seed user ${u.email}:`, err.message);
    }
  }
}

const bedsToSeed = [
  { bed_id: 'ICU-01', ward: 'I.C.U.', type: 'ICU', status: 'Occupied' },
  { bed_id: 'ICU-02', ward: 'I.C.U.', type: 'ICU', status: 'Available' },
  { bed_id: 'MICU-01', ward: 'Medical ICU', type: 'ICU', status: 'Occupied' },
  { bed_id: 'GENB-01', ward: 'Gen Ward B', type: 'General', status: 'Occupied' },
  { bed_id: 'GENB-02', ward: 'Gen Ward B', type: 'General', status: 'Available' },
];

const machinesToSeed = [
  { machine_id: 'VENT-001', type: 'Ventilator', ward: 'I.C.U.', status: 'In Use' },
  { machine_id: 'VENT-002', type: 'Ventilator', ward: 'I.C.U.', status: 'Available' },
  { machine_id: 'ECG-001', type: 'ECG Monitor', ward: 'Gen Ward B', status: 'Available' },
  { machine_id: 'US-001', type: 'Ultrasound', ward: 'Medical ICU', status: 'In Use' },
];

async function seedData() {
  const batch = db.batch();
  
  for (const bed of bedsToSeed) {
    const ref = db.collection('beds').doc(bed.bed_id);
    batch.set(ref, bed, { merge: true });
  }

  for (const machine of machinesToSeed) {
    const ref = db.collection('machines').doc(machine.machine_id);
    batch.set(ref, machine, { merge: true });
  }

  await batch.commit();
  console.log('Successfully seeded beds and machines.');
}

async function run() {
  await seedUsers();
  await seedData();
  process.exit(0);
}

run();
