import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
import { parse, format, isValid, parseISO } from 'date-fns';

// Load env vars
dotenv.config({ path: '../../.env.local' });

// Initialize Firebase Admin (assuming user fills in .env.local)
if (!getApps().length && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const db = getApps().length ? getFirestore() : null;

// Normalization Helpers
const normalizeWard = (ward: string) => {
  const w = ward.trim().toLowerCase();
  if (w.includes('pediatric') || w.includes('paediatric')) return 'Paediatrics';
  if (w === 'i.c.u.' || w === 'icu') return 'ICU';
  if (w === 'medical icu' || w === 'micu' || w === 'micu ') return 'MICU';
  if (w === 'general ward - a' || w === 'gen ward a' || w === 'gen ward a ') return 'Gen Ward A';
  if (w === 'general ward b' || w === 'gen ward b' || w === 'gen ward b ') return 'Gen Ward B';
  return ward.trim();
};

const normalizePatientId = (id: string) => {
  let pid = id.trim();
  if (!pid.startsWith('MCH-')) {
    pid = `MCH-000${pid}`;
  }
  return pid;
};

const parseCustomDate = (dateStr: string, formatStr: string) => {
  if (!dateStr) return null;
  const parsed = parse(dateStr.trim(), formatStr, new Date());
  return isValid(parsed) ? parsed : null;
};

const processCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

async function run() {
  console.log('Starting data reconciliation...');
  
  const publicDir = path.join(__dirname, '../public');
  
  // 1. Load Data
  const hisData = await processCSV(path.join(publicDir, '01_his_admissions_discharges.csv'));
  const labData = await processCSV(path.join(publicDir, '02_lab_order_to_result.csv'));
  const manualData = await processCSV(path.join(publicDir, '03_bed_occupancy_manual.csv'));

  console.log(`Loaded ${hisData.length} HIS records, ${labData.length} Lab records, ${manualData.length} Manual logs.`);

  // 2. Reconcile HIS Admissions
  const admissions = hisData.map(row => {
    return {
      patientId: normalizePatientId(row.patient_id),
      admissionDate: parseCustomDate(row.admission_datetime, 'yyyy-MM-dd HH:mm:ss'),
      dischargeDate: row.discharge_datetime ? parseCustomDate(row.discharge_datetime, 'yyyy-MM-dd HH:mm:ss') : null,
      ward: normalizeWard(row.ward),
      department: row.admitting_department,
      age: parseInt(row.age),
      gender: row.gender.trim().toUpperCase().startsWith('F') ? 'F' : 'M',
    };
  });

  // 3. Reconcile Lab Orders
  const labOrders = labData.map(row => {
    return {
      orderId: row.order_id,
      patientId: normalizePatientId(row.patient_id),
      testName: row.test_name,
      orderedAt: parseCustomDate(row.ordered_at, 'dd/MM/yyyy HH:mm'),
      collectedAt: parseCustomDate(row.collected_at, 'dd/MM/yyyy HH:mm'),
      resultedAt: row.resulted_at ? parseCustomDate(row.resulted_at, 'dd/MM/yyyy HH:mm') : null,
      priority: row.priority.trim().toUpperCase(),
      department: row.department,
    };
  });

  // 4. Reconcile Bed Occupancy (Merge manual remarks with calculated data)
  // We'll process this at the app level dynamically or pre-calculate it here.
  // For now, we will store the manual logs cleanly.
  const bedOccupancy = manualData.map(row => {
    return {
      date: parseCustomDate(row.Date, 'dd-MMM-yy'),
      ward: normalizeWard(row.Ward),
      totalBeds: parseInt(row['Total Beds']),
      manualOccupied: parseInt(row.Occupied) || 0,
      manualAvailable: parseInt(row.Available) || 0,
      remarks: row.Remarks,
    };
  });

  console.log('Reconciliation complete. Proceeding to seed to Firebase (if configured).');

  if (db) {
    console.log('Firebase DB initialized. Seeding...');
    
    // Seed Admissions
    const admissionsBatch = db.batch();
    admissions.forEach((a, i) => {
      if(a.patientId) {
        const ref = db.collection('admissions').doc(`${a.patientId}_${i}`);
        admissionsBatch.set(ref, a);
      }
    });
    await admissionsBatch.commit();
    console.log('Seeded admissions.');

    // Seed Labs
    // Firebase batches have a limit of 500 ops. We should chunk them.
    const chunkArray = (arr: any[], size: number) => 
      Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );

    const labChunks = chunkArray(labOrders, 400);
    for (let chunk of labChunks) {
      const b = db.batch();
      chunk.forEach(lab => {
        const ref = db.collection('lab_orders').doc(lab.orderId);
        b.set(ref, lab);
      });
      await b.commit();
    }
    console.log('Seeded lab orders.');

    // Seed Manual Bed Occupancy
    const occBatch = db.batch();
    bedOccupancy.forEach((occ, i) => {
      if(occ.date && occ.ward) {
        const dateStr = format(occ.date, 'yyyy-MM-dd');
        const ref = db.collection('daily_occupancy_manual').doc(`${dateStr}_${occ.ward.replace(/\s+/g, '')}`);
        occBatch.set(ref, occ);
      }
    });
    await occBatch.commit();
    console.log('Seeded manual bed occupancy.');
    
    console.log('Seeding finished!');
  } else {
    console.log('Firebase not initialized. Skipped seeding. Add credentials to .env.local and run again.');
  }
}

run().catch(console.error);
