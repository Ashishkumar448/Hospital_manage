"use client";

import React, { useState } from "react";
import { auth } from "@repo/firebase";

export default function UserManagementPage() {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState("doctor");
  const [department, setDepartment] = useState("");
  const [ward, setWard] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSetClaims = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Must be logged in to set claims");
      
      const token = await user.getIdToken();
      
      const response = await fetch("/api/set-claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ uid, role, department, ward })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to set claims");
      }

      setMessage(`Success: ${data.message}`);
      setUid("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">User Role Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <form onSubmit={handleSetClaims} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">User UID</label>
            <input
              type="text"
              required
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. abc123def456..."
            />
            <p className="text-xs text-slate-500 mt-1">The Firebase UID of the user.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="doctor">Doctor</option>
              <option value="staff">Staff / Nurse</option>
              <option value="executive">Executive</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === "doctor" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Cardiology"
              />
            </div>
          )}

          {role === "staff" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ward</label>
              <input
                type="text"
                required
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Gen Ward B"
              />
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Assigning..." : "Assign Role"}
          </button>
        </form>
      </div>
    </div>
  );
}
