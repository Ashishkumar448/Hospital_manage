"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@repo/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "@repo/ui/AuthProvider";
import { Chatbot } from "@repo/ui/Chatbot";

const CATEGORY_MAP: Record<string, string> = {
  "Skin": "Dermatology",
  "Diabetes": "Endocrinology",
  "BP": "Cardiology",
  "Bone": "Orthopedics"
};

interface PatientAdmission {
  id: string;
  patientId: string;
  admissionDate: any;
  dischargeDate: any;
  department: string;
  age: number;
  gender: string;
}

export default function StaffDashboard() {
  const { user, ward, loading: authLoading } = useAuth();
  
  // OPD Form State
  const [patientName, setPatientName] = useState("");
  const [patientIdInput, setPatientIdInput] = useState("");
  const [category, setCategory] = useState("Skin");
  const [priority, setPriority] = useState("Normal");
  const [opdLoading, setOpdLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Bed Board State
  const [admissions, setAdmissions] = useState<PatientAdmission[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);

  // Tabs & Triage State
  const [activeTab, setActiveTab] = useState("ops");
  const [triageHistory, setTriageHistory] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState("");
  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  useEffect(() => {
    const fetchBedBoard = async () => {
      // For demo purposes, if the user doesn't have a ward claim, we fallback to a default ward
      const targetWard = ward || "Gen Ward B";
      
      try {
        const q = query(collection(db, "admissions"), where("ward", "==", targetWard));
        const snap = await getDocs(q);
        
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientAdmission));
        // Sort by admission date descending
        data.sort((a, b) => {
          const tA = a.admissionDate?.toDate ? a.admissionDate.toDate().getTime() : 0;
          const tB = b.admissionDate?.toDate ? b.admissionDate.toDate().getTime() : 0;
          return tB - tA;
        });

        setAdmissions(data);
      } catch (err) {
        console.error("Failed to fetch bed board:", err);
      } finally {
        setBoardLoading(false);
      }
    };

    if (!authLoading) {
      fetchBedBoard();
    }
  }, [ward, authLoading]);

  useEffect(() => {
    const fetchTriageHistory = async () => {
      try {
        const q = query(collection(db, "triage_history"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setTriageHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to fetch triage history:", err);
      }
    };
    if (activeTab === "ai") {
      fetchTriageHistory();
    }
  }, [activeTab]);

  const handleRegisterOPD = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpdLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const assignedDepartment = CATEGORY_MAP[category] || "General Medicine";
      
      await addDoc(collection(db, "opd_visits"), {
        patient_id: patientIdInput,
        patient_name: patientName,
        category,
        priority,
        assigned_department: assignedDepartment,
        status: "Waiting",
        registered_at: serverTimestamp(),
        registered_by: user?.uid
      });

      setMessage({ text: `Successfully registered ${patientName} to ${assignedDepartment} OPD.`, type: "success" });
      setPatientName("");
      setPatientIdInput("");
    } catch (err: any) {
      setMessage({ text: `Error: ${err.message}`, type: "error" });
    } finally {
      setOpdLoading(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriageLoading(true);
    setTriageResult(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientSymptoms: symptoms, bedBoardAdmissions: admissions })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Save to history
      const docRef = await addDoc(collection(db, "triage_history"), {
        symptoms,
        result: data,
        createdAt: serverTimestamp(),
        staffId: user?.uid
      });

      setTriageResult(data);
      setTriageHistory(prev => [{ id: docRef.id, symptoms, result: data, createdAt: new Date() }, ...prev]);
      setSymptoms("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTriageLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Nursing & Staff Portal</h1>
          <p className="text-slate-400 text-lg">Manage OPD Triage and Monitor Ward Bed Board.</p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="mt-4 md:mt-0 px-6 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all font-medium"
        >
          Sign Out
        </button>
      </div>

      <div className="flex border-b border-slate-700/50 mb-8">
        <button 
          onClick={() => setActiveTab("ops")}
          className={`px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === 'ops' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Ward Operations
        </button>
        <button 
          onClick={() => setActiveTab("ai")}
          className={`px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === 'ai' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          AI Triage & History
        </button>
      </div>

      {activeTab === "ops" ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* OPD Registration Form */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                OPD Triage & Registration
              </h2>
              
              <form onSubmit={handleRegisterOPD} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">Patient ID</label>
                    <input type="text" required value={patientIdInput} onChange={(e) => setPatientIdInput(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. MCH-0001005" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">Patient Name</label>
                    <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Full Name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">Condition Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all">
                    {Object.keys(CATEGORY_MAP).map(cat => (
                      <option key={cat} value={cat}>{cat} ({CATEGORY_MAP[cat]})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">Triage Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all">
                    <option value="Normal">Normal</option>
                    <option value="Rapid Priority">Rapid Priority / Emergency</option>
                  </select>
                </div>

                {message.text && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    <span className="text-sm font-medium">{message.text}</span>
                  </div>
                )}

                <button type="submit" disabled={opdLoading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                  {opdLoading ? "Registering..." : "Register to OPD"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Ward Bed Board */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
          <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-[#0f172a]/30">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Ward Bed Board
                </h2>
                <p className="text-slate-400 text-sm mt-1">{ward || "Gen Ward B"}</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                {admissions.length} Patients
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {boardLoading || authLoading ? (
                <div className="flex justify-center items-center h-40">
                  <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : (
                <ul className="divide-y divide-slate-700/50">
                  {admissions.map(adm => (
                    <li key={adm.id} className="p-6 hover:bg-[#0f172a]/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-white text-lg">{adm.patientId}</span>
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-semibold">{adm.age}y / {adm.gender}</span>
                          </div>
                          <p className="text-slate-400 text-sm">{adm.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Admitted</p>
                          <p className="text-slate-300 text-sm font-medium">{formatDate(adm.admissionDate)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                  {admissions.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No active admissions found for this ward.
                    </div>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
        
        {/* Triage Form */}
        <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Patient Assessment</h2>
            <form onSubmit={handleTriageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Describe Patient Symptoms / Condition</label>
                <textarea 
                  required 
                  value={symptoms} 
                  onChange={e => setSymptoms(e.target.value)}
                  rows={5}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. 54yo male complaining of severe chest pain radiating to left arm..."
                />
              </div>
              <button type="submit" disabled={triageLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all">
                {triageLoading ? "Analyzing..." : "Generate AI Triage Recommendation"}
              </button>
            </form>

            {triageResult && (
              <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Recommendation</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Department</p>
                    <p className="text-white font-medium">{triageResult.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Priority</p>
                    <p className={`font-medium ${triageResult.priority === 'Rapid Priority' ? 'text-red-400' : 'text-emerald-400'}`}>{triageResult.priority}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-slate-400 uppercase font-bold">Recommended Bed</p>
                  <p className="text-indigo-300 font-medium">{triageResult.recommendedBed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Reasoning</p>
                  <p className="text-slate-300 text-sm mt-1 leading-relaxed">{triageResult.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Triage History */}
        <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative flex flex-col h-[600px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Triage History</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {triageHistory.length === 0 ? (
              <p className="text-slate-400 text-center py-10">No triage history found.</p>
            ) : (
              triageHistory.map(history => (
                <div key={history.id} className="p-5 bg-[#0f172a]/60 border border-slate-700/50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${history.result?.priority === 'Rapid Priority' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {history.result?.priority}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(history.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3 border-l-2 border-slate-600 pl-3">"{history.symptoms}"</p>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="text-blue-400">{history.result?.department}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-indigo-400">{history.result?.recommendedBed}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      )}
      {activeTab === "ops" && <Chatbot apiEndpoint="/api/chat" contextData={{ bed_board_admissions: admissions }} botName="Ops Assistant" />}
    </div>
  );
}
