"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@repo/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "@repo/ui/AuthProvider";

interface PatientAdmission {
  id: string;
  patient_id: string;
  admission_datetime: string;
  ward: string;
  age: string;
  gender: string;
}

interface OPDVisit {
  id: string;
  patient_id: string;
  patient_name: string;
  category: string;
  priority: string;
  status: string;
  registered_at: any;
}

export default function DoctorDashboard() {
  const { department } = useAuth();
  const [patients, setPatients] = useState<PatientAdmission[]>([]);
  const [opdVisits, setOpdVisits] = useState<OPDVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!department) return;
      try {
        // Fetch Admissions
        const qAdmissions = query(
          collection(db, "admissions"),
          where("admitting_department", "==", department)
        );
        const snapAdmissions = await getDocs(qAdmissions);
        setPatients(snapAdmissions.docs.map((d: any) => ({ id: d.id, ...d.data() })) as PatientAdmission[]);

        // Fetch OPD Visits
        const qOpd = query(
          collection(db, "opd_visits"),
          where("assigned_department", "==", department),
          where("status", "==", "Waiting")
        );
        const snapOpd = await getDocs(qOpd);
        let visits = snapOpd.docs.map((d: any) => ({ id: d.id, ...d.data() })) as OPDVisit[];
        
        // Sort: Rapid Priority first, then by registration time
        visits.sort((a, b) => {
          if (a.priority === "Rapid Priority" && b.priority !== "Rapid Priority") return -1;
          if (b.priority === "Rapid Priority" && a.priority !== "Rapid Priority") return 1;
          
          const timeA = a.registered_at?.toMillis() || 0;
          const timeB = b.registered_at?.toMillis() || 0;
          return timeA - timeB;
        });

        setOpdVisits(visits);

      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [department]);

  const markComplete = async (visitId: string) => {
    try {
      await updateDoc(doc(db, "opd_visits", visitId), {
        status: "Completed"
      });
      setOpdVisits(prev => prev.filter(v => v.id !== visitId));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Physician Portal</h1>
          <p className="text-slate-500 mt-2">Department: <span className="font-semibold text-slate-700">{department || "Loading..."}</span></p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="text-slate-600 hover:text-red-600 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {loading ? (
        <p className="text-slate-500">Loading dashboard...</p>
      ) : error ? (
        <p className="text-red-500 bg-red-50 p-4 rounded-md">{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* OPD Priority Queue */}
          <div className="bg-white shadow sm:rounded-lg p-6 border-t-4 border-indigo-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">OPD Priority Queue</h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {opdVisits.length} Waiting
              </span>
            </div>
            
            {opdVisits.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No patients in OPD queue.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {opdVisits.map(visit => (
                  <li key={visit.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        {visit.patient_name} ({visit.patient_id})
                        {visit.priority === "Rapid Priority" && (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Rapid</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">{visit.category} Condition</p>
                    </div>
                    <button 
                      onClick={() => markComplete(visit.id)}
                      className="text-xs bg-slate-100 hover:bg-green-100 hover:text-green-700 text-slate-600 font-medium py-1.5 px-3 rounded transition-colors"
                    >
                      Mark Seen
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Admitted Patients */}
          <div className="bg-white shadow sm:rounded-lg p-6 border-t-4 border-blue-500">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Admitted Patients</h2>
            
            {patients.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No admitted patients found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-3 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ward</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {patients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-blue-600">{p.patient_id}</p>
                          <p className="text-xs text-slate-500">{p.age} / {p.gender}</p>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-700">{p.ward}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
