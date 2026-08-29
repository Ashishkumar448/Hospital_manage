# Hospital Operations Platform

A comprehensive, role-based monorepo application designed to manage hospital operations efficiently. Built with Turborepo, Next.js (App Router), and Firebase (Auth, Firestore).

## Project Structure

This monorepo contains several distinct applications, each tailored for a specific role within the hospital. Role-based access control (RBAC) ensures users only see the data and interfaces they are authorized to access.

### 1. Admin Portal (`apps/admin`)
**Target Users:** System Administrators, IT Staff
**What Admins can do:**
- **Add and Configure Beds/Machines:** Add new hospital beds or medical machines, edit their details, and assign them to specific wards.
- **Assign and Manage Staff Members:** Create user accounts and explicitly assign doctors to departments and nurses to wards.
- **Manage Roles and Claims:** Change user roles (e.g., promote a staff member to admin) or update their access scope.
- **Resolve Data Conflicts:** Monitor data pipelines, review flagged data discrepancies (e.g., EMR vs manual sheets), and manually override to resolve conflicts.

### 2. Physician Portal (`apps/doctor`)
**Target Users:** Doctors, Specialists
**What Doctors can do:**
- **View Department Patients:** Instantly see a list of all patients currently admitted to their specific department.
- **Monitor Patient Health:** View live vitals, active medical problems, and complete admission histories for assigned patients.
- **Place Lab and Imaging Orders:** Order lab tests or imaging for a patient directly from the dashboard.
- **Prescribe Medication:** Write and submit medication prescriptions to be executed by the ward staff.
- **Receive Critical Alerts:** Get immediate notifications when a critical lab result comes back or if a test is delayed.

### 3. Staff & Nursing Portal (`apps/otherst`)
**Target Users:** Nurses, Ward Managers, Care Staff
**What Nurses and Care Staff can do:**
- **Update Bed Status:** Mark beds in their assigned ward as "Occupied," "Vacant," or "Cleaning" with a single tap.
- **Log Vitals and Tasks:** Enter real-time patient vitals that instantly appear on the doctor's dashboard.
- **Administer Medication:** Log when a prescribed medication has been administered to a patient.
- **Update Lab Samples:** Mark a lab sample as "Collected" so the lab knows it is on the way.
- **Log Equipment Usage:** Assign a specific medical machine (e.g., ventilator) to a patient or flag it for maintenance.
- **AI Triage System:** Use a dedicated AI interface to input patient symptoms. The AI Triage Director automatically recommends the correct department, priority, and assigns an available bed by cross-referencing live bed board data, while saving all triage histories.

### 4. Executive Portal (`apps/executives`)
**Target Users:** Hospital Executives, Operations Directors
**What Executives can do:**
- **View Hospital-Wide Occupancy:** Check the live total bed occupancy percentage across the entire hospital without needing to request reports.
- **Track Patient Flow:** Monitor admission and discharge velocity and track Average Length of Stay (ALOS).
- **Monitor Lab Efficiency:** View the average turnaround time for lab results across different departments.
- **Assess Data Reliability:** See exactly how confident they should be in the numbers via the "Data Confidence Indicator."
- **Track Resource Utilization:** See the ratio of staff-to-patients and check if critical equipment (like ventilators) are suffering from high downtime.

### 5. Patient Portal (`apps/user`)
**Target Users:** Patients
**What Patients can do:**
- **View Care Status:** Check their current admission status, assigned ward, and estimated discharge date.
- **View Test Results:** Securely download or view released lab reports and diagnostic results.
- **View Prescriptions:** See exactly what medications they have been prescribed and review discharge instructions.
- **AI Health Assistant:** Chat with an integrated, intelligent assistant (supporting both English and Hindi) to ask general hospital questions or inquire about their health data. Includes an "AI Consultations" tab to permanently save and review past chat sessions.

## Shared Packages

- `@repo/ui`: Shared React components, including the authentication screens, landing page, protected route wrappers, and the unified AI Chatbot interface.
- `@repo/firebase`: Shared Firebase initialization and configuration logic.
- `@repo/eslint-config`, `@repo/typescript-config`, `@repo/tailwind-config`: Shared linting, typing, and styling configurations ensuring consistency across all apps.

## Getting Started

1. Clone the repository and run `pnpm install`
2. Ensure you have the proper Firebase credentials in your `.env.local` file.
3. Run `pnpm dev` to start all applications in development mode simultaneously.
4. Access the apps via their respective localhost ports (default: 3000-3004).
