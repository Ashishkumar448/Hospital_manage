"use client";

import React from "react";
import { auth } from "@repo/firebase";

export default function PatientDashboard() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Patient Portal</h1>
        <button 
          onClick={() => auth.signOut()}
          className="text-slate-600 hover:text-red-600 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
      <div className="bg-white shadow sm:rounded-lg p-6 text-slate-500">
        Patient Dashboard Content...
      </div>
    </div>
  );
}
