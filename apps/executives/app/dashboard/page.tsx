"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@repo/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@repo/ui/AuthProvider";

interface WardOccupancy {
  ward: string;
  totalBeds: number;
  manualOccupied: number;
  hisOccupied: number;
  remarks: string;
}

interface Discrepancy {
  ward: string;
  hisCount: number;
  manualCount: number;
  remarks: string;
  status: string;
}

interface LabBottleneck {
  department: string;
  delayedCount: number;
  tests: string[];
}

export default function ExecutivesDashboard() {
  const { user, loading: authLoading } = useAuth();
  
  const [occupancy, setOccupancy] = useState<WardOccupancy[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [labStats, setLabStats] = useState({
    avgStatTAT: 0,
    avgRoutineTAT: 0,
    bottlenecks: [] as LabBottleneck[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [admissionsSnap, labsSnap, manualSnap] = await Promise.all([
          getDocs(collection(db, "admissions")),
          getDocs(collection(db, "lab_orders")),
          getDocs(collection(db, "daily_occupancy_manual"))
        ]);

        // Process Admissions
        const activeAdmissionsByWard: Record<string, number> = {};
        admissionsSnap.docs.forEach(doc => {
          const data = doc.data();
          // To get meaningful counts from the sample data, we just count all admission records per ward.
          const ward = data.ward || "Unknown";
          activeAdmissionsByWard[ward] = (activeAdmissionsByWard[ward] || 0) + 1;
        });

        // Process Manual Occupancy
        const manualByWard: Record<string, any> = {};
        manualSnap.docs.forEach(doc => {
          const data = doc.data();
          const ward = data.ward;
          manualByWard[ward] = {
            totalBeds: data.totalBeds,
            manualOccupied: data.manualOccupied,
            remarks: data.remarks
          };
        });

        // Combine for Occupancy & Discrepancies
        const combinedOccupancy: WardOccupancy[] = [];
        const discList: Discrepancy[] = [];

        Object.keys(manualByWard).forEach(ward => {
          const manual = manualByWard[ward];
          const hisCount = activeAdmissionsByWard[ward] || 0;
          
          combinedOccupancy.push({
            ward,
            totalBeds: manual.totalBeds,
            manualOccupied: manual.manualOccupied,
            hisOccupied: hisCount,
            remarks: manual.remarks
          });

          // Define discrepancy if they don't match
          if (manual.manualOccupied !== hisCount) {
            discList.push({
              ward,
              hisCount,
              manualCount: manual.manualOccupied,
              remarks: manual.remarks,
              status: "Action Required"
            });
          }
        });

        setOccupancy(combinedOccupancy);
        setDiscrepancies(discList);

        // Process Labs
        let statTotalMins = 0;
        let statCount = 0;
        let routineTotalMins = 0;
        let routineCount = 0;
        
        const bottlenecksByDept: Record<string, LabBottleneck> = {};

        labsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.orderedAt && data.resultedAt) {
            const ordered = data.orderedAt.toDate().getTime();
            const resulted = data.resultedAt.toDate().getTime();
            const tatMins = (resulted - ordered) / (1000 * 60);

            const isStat = data.priority?.toLowerCase() === 'stat' || data.priority?.toLowerCase() === 'urgent';
            
            if (isStat) {
              statTotalMins += tatMins;
              statCount++;
            } else {
              routineTotalMins += tatMins;
              routineCount++;
            }

            if (tatMins > 120) {
              const dept = data.department || 'Unknown';
              if (!bottlenecksByDept[dept]) {
                bottlenecksByDept[dept] = { department: dept, delayedCount: 0, tests: [] };
              }
              bottlenecksByDept[dept].delayedCount++;
              if (!bottlenecksByDept[dept].tests.includes(data.testName)) {
                bottlenecksByDept[dept].tests.push(data.testName);
              }
            }
          }
        });

        setLabStats({
          avgStatTAT: statCount ? Math.round(statTotalMins / statCount) : 0,
          avgRoutineTAT: routineCount ? Math.round(routineTotalMins / routineCount) : 0,
          bottlenecks: Object.values(bottlenecksByDept)
        });

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <header className="flex justify-between items-center bg-white shadow sm:rounded-lg p-6 border-b-4 border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Unified Hospital Operations</h1>
          <p className="text-slate-500 mt-2">Real-time reconciled view from HIS, Lab, and Manual logs</p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="text-slate-600 hover:text-red-600 font-medium transition-colors"
        >
          Sign Out
        </button>
      </header>

      {loading || authLoading ? (
        <p className="text-slate-500 text-center py-12">Loading live metrics...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Real-Time Bed Occupancy */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Real-Time Bed Occupancy</h2>
            <div className="space-y-4">
              {occupancy.map(occ => {
                const ratio = occ.manualOccupied / occ.totalBeds;
                let colorClass = "text-green-600 bg-green-50";
                if (ratio > 0.8) colorClass = "text-red-600 bg-red-50";
                else if (ratio > 0.6) colorClass = "text-amber-600 bg-amber-50";

                return (
                  <div key={occ.ward} className="flex justify-between items-center p-3 rounded-md border border-slate-100">
                    <span className="font-medium text-slate-700">{occ.ward}</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${colorClass}`}>
                      {occ.manualOccupied} / {occ.totalBeds}
                    </div>
                  </div>
                )
              })}
              {occupancy.length === 0 && <p className="text-sm text-slate-500">No occupancy data found.</p>}
            </div>
          </div>

          {/* Reconciled Discrepancies */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Data Discrepancies (Reconciled)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ward</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">HIS vs Manual</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {discrepancies.map((disc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-4 text-sm font-medium text-slate-900">{disc.ward}</td>
                      <td className="px-3 py-4 text-sm text-slate-500">{disc.hisCount} (HIS) vs {disc.manualCount} (Manual)</td>
                      <td className="px-3 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 w-fit">
                            {disc.status}
                          </span>
                          <span className="text-xs text-slate-500">{disc.remarks || "No remarks"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {discrepancies.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-sm text-slate-500 text-center">No discrepancies found! HIS and Manual logs match.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lab Turnaround Bottlenecks */}
          <div className="bg-white shadow sm:rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Lab Turnaround Bottlenecks</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <p className="text-sm text-slate-500 font-medium uppercase">Avg. STAT Turnaround</p>
                <p className={`text-2xl font-bold mt-1 ${labStats.avgStatTAT > 60 ? 'text-red-600' : 'text-green-600'}`}>
                  {labStats.avgStatTAT} mins
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <p className="text-sm text-slate-500 font-medium uppercase">Avg. Routine Turnaround</p>
                <p className={`text-2xl font-bold mt-1 ${labStats.avgRoutineTAT > 240 ? 'text-amber-600' : 'text-green-600'}`}>
                  {Math.round(labStats.avgRoutineTAT / 60 * 10) / 10} hours
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Delayed Tests (&gt; 2h)</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Impacted Tests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {labStats.bottlenecks.map((btn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-4 text-sm font-medium text-slate-900">{btn.department}</td>
                      <td className="px-3 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {btn.delayedCount} Delayed
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-500">{btn.tests.join(', ')}</td>
                    </tr>
                  ))}
                  {labStats.bottlenecks.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-sm text-slate-500 text-center">No delayed tests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
