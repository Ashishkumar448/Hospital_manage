"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@repo/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface Medicine {
  id: string;
  name: string;
  stock: number;
  unit: string;
  category: string;
}

interface Machine {
  id: string;
  machine_id: string;
  type: string;
  ward: string;
  status: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"staff" | "pharmacy" | "facilities">("staff");

  // Staff Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("doctor");
  
  // Data State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  // Form States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchInventory = async () => {
    try {
      const [medSnap, machSnap] = await Promise.all([
        getDocs(collection(db, "medicines")),
        getDocs(collection(db, "machines"))
      ]);
      setMedicines(medSnap.docs.map(d => ({ id: d.id, ...d.data() } as Medicine)));
      setMachines(machSnap.docs.map(d => ({ id: d.id, ...d.data() } as Machine)));
    } catch (error) {
      console.error("Error fetching inventory", error);
    }
  };

  useEffect(() => {
    if (activeTab === "pharmacy" || activeTab === "facilities") {
      fetchInventory();
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email, password, displayName, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setMessage({ text: `Successfully created user (${role})!`, type: "success" });
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, "medicines"), {
        name: formData.get("name"),
        stock: Number(formData.get("stock")),
        unit: formData.get("unit"),
        category: formData.get("category"),
      });
      e.currentTarget.reset();
      fetchInventory();
    } catch (error) {
      alert("Failed to add medicine");
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (confirm("Delete this medicine?")) {
      await deleteDoc(doc(db, "medicines", id));
      fetchInventory();
    }
  };

  const handleAddMachine = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      // For machines, we use the machine_id as the document ID for uniqueness if desired,
      // but let's use addDoc for simplicity here, or setDoc.
      await addDoc(collection(db, "machines"), {
        machine_id: formData.get("machine_id"),
        type: formData.get("type"),
        ward: formData.get("ward"),
        status: formData.get("status"),
      });
      e.currentTarget.reset();
      fetchInventory();
    } catch (error) {
      alert("Failed to add machine");
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (confirm("Delete this machine?")) {
      await deleteDoc(doc(db, "machines", id));
      fetchInventory();
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Hospital Administration</h1>
          <p className="text-slate-400 text-lg">Manage personnel RBAC, pharmacy inventory, and lab facilities.</p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="mt-4 md:mt-0 text-slate-400 hover:text-red-400 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="flex space-x-2 mb-8 bg-[#1e293b]/50 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button 
          onClick={() => setActiveTab("staff")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "staff" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
        >
          Staff & Roles
        </button>
        <button 
          onClick={() => setActiveTab("pharmacy")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "pharmacy" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
        >
          Pharmacy Inventory
        </button>
        <button 
          onClick={() => setActiveTab("facilities")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "facilities" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
        >
          Lab Facilities
        </button>
      </div>

      {/* --- STAFF TAB --- */}
      {activeTab === "staff" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="lg:col-span-2">
            <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="p-8">
                <h2 className="text-xl font-bold text-white mb-6">Register New Personnel</h2>
                <form className="space-y-6" onSubmit={handleCreateUser}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">Full Name</label>
                      <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" placeholder="Dr. Sarah Jenkins" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">Email Address</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" placeholder="s.jenkins@hospital.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">Temporary Password</label>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">Assign Role</label>
                      <div className="relative">
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full appearance-none bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all">
                          <option value="doctor">Physician (Doctor)</option>
                          <option value="staff">Nursing & Staff</option>
                          <option value="executive">Executive</option>
                          <option value="admin">System Admin</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  {message.text && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      <span className="text-sm font-medium">{message.text}</span>
                    </div>
                  )}
                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold transition-all hover:bg-purple-500 disabled:opacity-50">
                      {loading ? "Provisioning..." : "Register User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {/* Info Card */}
          <div className="space-y-6">
            <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">Role Guidelines</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><strong className="text-slate-300">Physicians</strong> view labs and authorize discharges.</li>
                <li><strong className="text-slate-300">Nursing</strong> log manual bed occupancies.</li>
                <li><strong className="text-slate-300">Executives</strong> view hospital-wide analytical data.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* --- PHARMACY TAB --- */}
      {activeTab === "pharmacy" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-6">Add New Medicine</h2>
                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Medicine Name</label>
                    <input name="name" type="text" required className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white" placeholder="Paracetamol" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Stock Quantity</label>
                    <input name="stock" type="number" required className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white" placeholder="500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Unit</label>
                    <input name="unit" type="text" required className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white" placeholder="mg, tablets, ml" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Category</label>
                    <select name="category" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white">
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Antiseptic">Antiseptic</option>
                      <option value="Anesthetic">Anesthetic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full mt-4 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all">Add to Inventory</button>
                </form>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
             <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
               <div className="p-6 border-b border-slate-700/50">
                 <h2 className="text-xl font-bold text-white">Current Stock</h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-700">
                   <thead className="bg-[#0f172a]">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Stock</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700/50">
                     {medicines.map((med) => (
                       <tr key={med.id} className="hover:bg-slate-800/50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{med.name}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{med.category}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${med.stock < 100 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{med.stock} {med.unit}</span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                           <button onClick={() => handleDeleteMedicine(med.id)} className="text-red-400 hover:text-red-300">Remove</button>
                         </td>
                       </tr>
                     ))}
                     {medicines.length === 0 && (
                       <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No medicines in inventory.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* --- FACILITIES TAB --- */}
      {activeTab === "facilities" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-6">Register Machine</h2>
                <form onSubmit={handleAddMachine} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Machine ID</label>
                    <input name="machine_id" type="text" required className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white" placeholder="USG-002" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Type</label>
                    <input name="type" type="text" required className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white" placeholder="Ultrasound" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Assigned Ward</label>
                    <input name="ward" type="text" required className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white" placeholder="Maternity Ward" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Status</label>
                    <select name="status" className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white">
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Order">Out of Order</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full mt-4 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all">Add Facility</button>
                </form>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
             <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
               <div className="p-6 border-b border-slate-700/50">
                 <h2 className="text-xl font-bold text-white">Registered Facilities</h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-700">
                   <thead className="bg-[#0f172a]">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type & Ward</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700/50">
                     {machines.map((mach) => (
                       <tr key={mach.id} className="hover:bg-slate-800/50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{mach.machine_id}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{mach.type} <span className="text-slate-500 text-xs block">{mach.ward}</span></td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                             mach.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' :
                             mach.status === 'In Use' ? 'bg-blue-500/20 text-blue-400' :
                             mach.status === 'Maintenance' ? 'bg-amber-500/20 text-amber-400' :
                             'bg-red-500/20 text-red-400'
                           }`}>{mach.status}</span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                           <button onClick={() => handleDeleteMachine(mach.id)} className="text-red-400 hover:text-red-300">Remove</button>
                         </td>
                       </tr>
                     ))}
                     {machines.length === 0 && (
                       <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No facilities registered.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
