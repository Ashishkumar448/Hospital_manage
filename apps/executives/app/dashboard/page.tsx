"use client";

import { useAuth } from "@repo/ui/AuthProvider";
import styles from "./dashboard.module.css";
import { useEffect, useState } from "react";

export default function ExecutivesDashboard() {
  const { user, role, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Unified Hospital Operations</h1>
        <p className={styles.subtitle}>Real-time reconciled view from HIS, Lab, and Manual logs</p>
      </header>

      <div className={styles.grid}>
        {/* Real-time Bed Occupancy Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Real-Time Bed Occupancy</h2>
          
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>I.C.U.</span>
            <span className={`${styles.metricValue} ${styles.critical}`}>12/12</span>
          </div>
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>Medical ICU</span>
            <span className={`${styles.metricValue} ${styles.warning}`}>9/10</span>
          </div>
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>General Ward A</span>
            <span className={`${styles.metricValue} ${styles.good}`}>16/30</span>
          </div>
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>General Ward B</span>
            <span className={`${styles.metricValue} ${styles.good}`}>15/30</span>
          </div>
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>Paediatrics</span>
            <span className={`${styles.metricValue} ${styles.warning}`}>14/16</span>
          </div>
        </div>

        {/* Reconciled Discrepancies Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Data Discrepancies (Reconciled)</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ward</th>
                <th>Conflict Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gen Ward B</td>
                <td>2 discharges pending paperwork</td>
                <td><span className={`${styles.badge} ${styles.conflict}`}>Action Required</span></td>
              </tr>
              <tr>
                <td>Paediatrics</td>
                <td>Includes 1 day-care patient</td>
                <td><span className={styles.badge}>Resolved (HIS)</span></td>
              </tr>
              <tr>
                <td>I.C.U.</td>
                <td>System was down - Manual Count Used</td>
                <td><span className={styles.badge}>Resolved (Manual)</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Lab Turnaround Bottlenecks Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Lab Turnaround Bottlenecks</h2>
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>Avg. STAT Turnaround</span>
            <span className={`${styles.metricValue} ${styles.warning}`}>112 mins</span>
          </div>
          <div className={styles.metricGroup}>
            <span className={styles.metricLabel}>Avg. Routine Turnaround</span>
            <span className={`${styles.metricValue} ${styles.good}`}>4.5 hours</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Department</th>
                <th>Delayed Tests (&gt; 2h)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cardiology</td>
                <td className={styles.critical}>8 (Troponin I)</td>
              </tr>
              <tr>
                <td>Emergency</td>
                <td className={styles.warning}>3 (CBC)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
