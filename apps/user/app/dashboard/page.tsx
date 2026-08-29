"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@repo/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@repo/ui/AuthProvider";
import { Chatbot } from "@repo/ui/Chatbot";

interface Admission {
  id: string;
  admissionDate: any;
  dischargeDate: any;
  department: string;
  ward: string;
  status: string;
}

interface LabOrder {
  id: string;
  testName: string;
  orderedAt: any;
  resultedAt: any;
  priority: string;
  status: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [labs, setLabs] = useState<LabOrder[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portal");

  // For the demo, we'll fetch data for a specific sample patient ID from the CSV
  const DEMO_PATIENT_ID = "MCH-0001001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Admissions
        const admQuery = query(collection(db, "admissions"), where("patientId", "==", DEMO_PATIENT_ID));
        const admSnap = await getDocs(admQuery);
        const admData = admSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            admissionDate: d.admissionDate,
            dischargeDate: d.dischargeDate,
            department: d.department,
            ward: d.ward,
            status: d.dischargeDate ? "Discharged" : "Admitted"
          } as Admission;
        });

        // Fetch Lab Orders
        const labQuery = query(collection(db, "lab_orders"), where("patientId", "==", DEMO_PATIENT_ID));
        const labSnap = await getDocs(labQuery);
        const labData = labSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            testName: d.testName,
            orderedAt: d.orderedAt,
            resultedAt: d.resultedAt,
            priority: d.priority,
            status: d.resultedAt ? "Completed" : "Pending"
          } as LabOrder;
        });

        setAdmissions(admData);
        setLabs(labData);
      } catch (err) {
        console.error("Failed to fetch patient data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "chat_history"), where("userId", "==", user.uid), orderBy("savedAt", "desc"));
        const snap = await getDocs(q);
        setChatHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchHistory();
  }, [user]);

  const handleSaveHistory = async (messages: any[]) => {
    if (!user) return alert("Please sign in to save chat history.");
    try {
      const docRef = await addDoc(collection(db, "chat_history"), {
        userId: user.uid,
        messages,
        savedAt: serverTimestamp()
      });
      setChatHistory(prev => [{ id: docRef.id, messages, savedAt: new Date() }, ...prev]);
      alert("Chat saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save chat.");
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="w-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">My Health Portal</h1>
          <p className="text-slate-400 text-lg">Welcome back. View your active hospital stays and latest lab results.</p>
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
          onClick={() => setActiveTab("portal")}
          className={`px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === 'portal' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          My Hospital Stays
        </button>
        <button 
          onClick={() => setActiveTab("ai")}
          className={`px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === 'ai' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          AI Consultations
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : activeTab === "portal" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Admissions Section */}
          <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Hospital Stays
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {admissions.map(adm => (
                  <div key={adm.id} className="p-4 rounded-xl bg-[#0f172a]/50 border border-slate-700/50 hover:border-teal-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-bold">{adm.department}</h3>
                        <p className="text-slate-400 text-sm">{adm.ward}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${adm.status === 'Admitted' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {adm.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase">Admitted</p>
                        <p className="text-slate-300 text-sm mt-1">{formatDate(adm.admissionDate)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase">Discharged</p>
                        <p className="text-slate-300 text-sm mt-1">{formatDate(adm.dischargeDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {admissions.length === 0 && (
                  <p className="text-slate-500 text-center py-4">No recent hospital stays found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Labs Section */}
          <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Lab Results
              </h2>
            </div>
            <div className="p-0">
              <div className="divide-y divide-slate-700/50">
                {labs.map(lab => (
                  <div key={lab.id} className="p-6 hover:bg-[#0f172a]/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${lab.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        <h3 className="text-white font-bold">{lab.testName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {lab.priority?.toLowerCase() === 'stat' && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/20">STAT</span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${lab.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {lab.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-[#0f172a]/50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-xs font-medium uppercase mb-1">Ordered</p>
                        <p className="text-slate-300 text-sm font-medium">{formatDate(lab.orderedAt)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-medium uppercase mb-1">Resulted</p>
                        <p className="text-slate-300 text-sm font-medium">{formatDate(lab.resultedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {labs.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No lab records found.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : activeTab === "ai" ? (
        <div className="animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold text-white mb-6">Saved AI Consultations</h2>
          {chatHistory.length === 0 ? (
            <p className="text-slate-400 bg-[#1e293b]/50 p-8 rounded-xl border border-slate-700/50 text-center">You have no saved consultations.</p>
          ) : (
            <div className="space-y-6">
              {chatHistory.map((chat) => (
                <div key={chat.id} className="bg-[#1e293b]/80 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                  <p className="text-sm text-slate-400 mb-4">{formatDate(chat.savedAt)}</p>
                  <div className="space-y-4">
                    {chat.messages.map((m: any, i: number) => (
                      <div key={i} className={`p-4 rounded-xl text-sm ${m.role === 'user' ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                        <span className="font-bold opacity-50 mr-2">{m.role.toUpperCase()}:</span>
                        {m.content}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      <Chatbot apiEndpoint="/api/chat" contextData={{ admissions, labs }} botName="Health Assistant" onSaveHistory={handleSaveHistory} />
    </div>
  );
}
