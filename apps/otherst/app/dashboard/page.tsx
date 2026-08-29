"use client";

import React, { useState } from "react";
import { auth, db } from "@repo/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@repo/ui/AuthProvider";

const CATEGORY_MAP: Record<string, string> = {
  "Skin": "Dermatology",
  "Diabetes": "Endocrinology",
  "BP": "Cardiology",
  "Bone": "Orthopedics"
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [category, setCategory] = useState("Skin");
  const [priority, setPriority] = useState("Normal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegisterOPD = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const assignedDepartment = CATEGORY_MAP[category] || "General Medicine";
      
      await addDoc(collection(db, "opd_visits"), {
        patient_id: patientId,
        patient_name: patientName,
        category,
        priority,
        assigned_department: assignedDepartment,
        status: "Waiting",
        registered_at: serverTimestamp(),
        registered_by: user?.uid
      });

      setMessage(`Successfully registered ${patientName} to ${assignedDepartment} OPD (${priority} priority).`);
      setPatientName("");
      setPatientId("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Nursing & Staff Portal</h1>
        <button 
          onClick={() => auth.signOut()}
          className="text-slate-600 hover:text-red-600 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* OPD Registration Form */}
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">OPD Triage & Registration</h2>
          <form onSubmit={handleRegisterOPD} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
              <input
                type="text"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="e.g. MCH-0001005"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condition Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                {Object.keys(CATEGORY_MAP).map(cat => (
                  <option key={cat} value={cat}>{cat} ({CATEGORY_MAP[cat]})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Triage Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="Normal">Normal</option>
                <option value="Rapid Priority">Rapid Priority / Emergency</option>
              </select>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Registering..." : "Register to OPD"}
            </button>
          </form>
        </div>

        {/* Placeholder for Bed Board */}
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Ward Bed Board</h2>
          <p className="text-slate-500">Bed management features will appear here.</p>
        </div>
      </div>
    </div>
  );
}
