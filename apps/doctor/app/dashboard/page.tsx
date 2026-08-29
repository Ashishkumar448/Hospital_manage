"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@repo/firebase";
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@repo/ui/AuthProvider";

interface PatientAdmission {
  id: string;
  patientId: string;
  admissionDate: any;
  department: string;
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
  const { user, department, loading: authLoading } = useAuth();
  const [patients, setPatients] = useState<PatientAdmission[]>([]);
  const [opdVisits, setOpdVisits] = useState<OPDVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"Available" | "Busy" | "Off Duty">("Available");

  useEffect(() => {
    async function fetchData() {
      // For demo fallback if department claim is missing
      const targetDept = department || "Cardiology";
      
      try {
        if (user) {
          const statusSnap = await getDoc(doc(db, "doctor_status", user.uid));
          if (statusSnap.exists()) {
            setStatus(statusSnap.data().status);
          }
        }

        // Fetch Admissions
        const qAdmissions = query(
          collection(db, "admissions"),
          where("department", "==", targetDept) // Fixed from admitting_department
        );
        const snapAdmissions = await getDocs(qAdmissions);
        setPatients(snapAdmissions.docs.map((d: any) => ({ id: d.id, ...d.data() })) as PatientAdmission[]);

        // Fetch OPD Visits
        const qOpd = query(
          collection(db, "opd_visits"),
          where("assigned_department", "==", targetDept),
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
    
    if (!authLoading) {
      fetchData();
    }
  }, [department, authLoading]);

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

  const toggleStatus = async (newStatus: "Available" | "Busy" | "Off Duty") => {
    if (!user) return;
    try {
      await setDoc(doc(db, "doctor_status", user.uid), { status: newStatus }, { merge: true });
      setStatus(newStatus);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
  };

  return (
    <div className="w-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Physician Portal</h1>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-lg">Department: <span className="font-semibold text-slate-200">{department || "Cardiology"}</span></p>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2 bg-[#0f172a] px-3 py-1.5 rounded-lg border border-slate-700">
              <span className={`w-2.5 h-2.5 rounded-full ${status === 'Available' ? 'bg-emerald-500' : status === 'Busy' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
              <select 
                value={status} 
                onChange={(e) => toggleStatus(e.target.value as any)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none appearance-none pr-4 cursor-pointer"
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy / In Consult</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>
          </div>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="mt-4 md:mt-0 px-6 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all font-medium"
        >
          Sign Out
        </button>
      </div>
      
      {loading || authLoading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* OPD Priority Queue */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
              
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-[#0f172a]/30">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  OPD Priority Queue
                </h2>
                <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full">
                  {opdVisits.length} Waiting
                </span>
              </div>
              
              <div className="p-0">
                {opdVisits.length === 0 ? (
                  <p className="text-slate-500 text-center py-10">No patients in OPD queue.</p>
                ) : (
                  <ul className="divide-y divide-slate-700/50">
                    {opdVisits.map(visit => (
                      <li key={visit.id} className="p-6 hover:bg-[#0f172a]/40 transition-colors flex justify-between items-center">
                        <div>
                          <p className="text-lg font-bold text-white flex items-center gap-3">
                            {visit.patient_name}
                            <span className="text-sm font-medium text-slate-400">({visit.patient_id})</span>
                            {visit.priority === "Rapid Priority" && (
                              <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase animate-pulse">Rapid</span>
                            )}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">{visit.category} Condition</p>
                        </div>
                        <button 
                          onClick={() => markComplete(visit.id)}
                          className="text-xs bg-[#0f172a] hover:bg-emerald-500/20 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 text-slate-300 font-bold py-2 px-4 rounded-lg transition-all shadow-lg"
                        >
                          Mark Seen
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Admitted Patients */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
            <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-[#0f172a]/30">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Admitted Patients
                </h2>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full">
                  {patients.length} In-Patient
                </span>
              </div>
              
              <div className="p-0">
                {patients.length === 0 ? (
                  <p className="text-slate-500 text-center py-10">No admitted patients found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700/50">
                      <thead className="bg-[#0f172a]/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ward</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Admitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {patients.map(p => (
                          <tr key={p.id} className="hover:bg-[#0f172a]/40 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold text-white">{p.patientId}</p>
                              <p className="text-xs text-slate-400 mt-1">{p.age}y / {p.gender}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                              {p.ward}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                              {formatDate(p.admissionDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
