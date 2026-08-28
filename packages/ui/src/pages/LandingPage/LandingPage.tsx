"use client";

import React from "react";

export interface LandingPageProps {
  urls?: {
    user?: string;
    doctor?: string;
    staff?: string;
    admin?: string;
    executive?: string;
  };
}

export const LandingPage = ({ urls }: LandingPageProps = {}) => {
  const userUrl = urls?.user || process.env.NEXT_PUBLIC_USER_URL || "http://localhost:3004";
  const doctorUrl = urls?.doctor || process.env.NEXT_PUBLIC_DOCTOR_URL || "http://localhost:3001";
  const staffUrl = urls?.staff || process.env.NEXT_PUBLIC_STAFF_URL || "http://localhost:3002";
  const adminUrl = urls?.admin || process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003";
  const executiveUrl = urls?.executive || process.env.NEXT_PUBLIC_EXECUTIVE_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Navbar */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Simple Logo Placeholder */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">+</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">City General Hospital</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Services</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Find a Doctor</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Locations</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
          </nav>
          <div className="flex items-center gap-4">
             <a href={`${userUrl}/login`}>
               <button className="hidden md:block bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                 Patient Login
               </button>
             </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full bg-blue-50 py-24 lg:py-32 overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-200/50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Compassionate Care. <span className="text-blue-600">Advanced Medicine.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mb-10 leading-relaxed">
            Providing world-class healthcare to our community for over 50 years. Our dedicated team of specialists is here to support you at every step of your health journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href={`${userUrl}/login`}>
              <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto">
                Book an Appointment
              </button>
            </a>
            <a href={`${userUrl}/login`}>
              <button className="bg-white text-blue-600 border border-blue-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-sm w-full sm:w-auto">
                View Patient Portal
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links / Portals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Hospital Portals</h2>
            <p className="text-slate-500 mt-4">Secure access for patients and staff</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Patient Portal */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Patients</h3>
              <p className="text-slate-500 mb-6 flex-grow">Access records, test results, and schedule appointments.</p>
              <a href={`${userUrl}/login`} className="text-blue-600 font-semibold group-hover:text-blue-700">Access Portal &rarr;</a>
            </div>

            {/* Doctor Portal */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-teal-200 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors">
                 <svg className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Physicians</h3>
              <p className="text-slate-500 mb-6 flex-grow">View lab results, patient charts, and manage care.</p>
              <a href={`${doctorUrl}/login`} className="text-teal-600 font-semibold group-hover:text-teal-700">Access Portal &rarr;</a>
            </div>

            {/* Staff Portal */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <svg className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Nursing & Staff</h3>
              <p className="text-slate-500 mb-6 flex-grow">Log bed occupancy, manual counts, and ward status.</p>
              <a href={`${staffUrl}/login`} className="text-indigo-600 font-semibold group-hover:text-indigo-700">Access Portal &rarr;</a>
            </div>

            {/* Exec & Admin Portal */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                <svg className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Administration</h3>
              <p className="text-slate-500 mb-6 flex-grow">Operations dashboard, capacity metrics, and system config.</p>
              <div className="flex gap-4 w-full justify-center">
                <a href={`${executiveUrl}/login`} className="text-purple-600 font-semibold hover:text-purple-800 text-sm">Dashboard</a>
                <span className="text-slate-300">|</span>
                <a href={`${adminUrl}/login`} className="text-purple-600 font-semibold hover:text-purple-800 text-sm">Sys Admin</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">+</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">City General</span>
            </div>
            <p className="text-sm leading-relaxed">
              123 Medical Center Blvd<br />
              Metropolis, NY 10001<br />
              Emergency: 911<br />
              General: (555) 123-4567
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Important Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Pay Your Bill</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Volunteering</a></li>
              <li><a href="#" className="hover:text-white transition-colors">News & Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Non-Discrimination</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          &copy; {new Date().getFullYear()} City General Hospital. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
