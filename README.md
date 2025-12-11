# MHO - Hospital Operations Agent System

**Version:** 1.0.0
**Architecture:** Agentic Microservices (Orchestrator Pattern)
**Compliance:** HIPAA Technical Safeguards Ready

## Overview

The **Manage Hospital Operations (MHO)** system is a specialized Progressive Web App (PWA) designed to streamline hospital operations using Generative AI. It utilizes a centralized **Orchestrator Agent** to interpret user intent and securely delegate tasks to specialized **Sub-Agents**.

This architecture ensures that sensitive tasks (like billing or medical records) are handled by strictly scoped agents with specific tool access, minimizing the risk of data leakage and ensuring auditability.

## 🏗 System Architecture

The system operates on a **Hub-and-Spoke** model:

1.  **Central Manager (Orchestrator):**
    *   *Role:* Intake and Triage.
    *   *Constraint:* Does NOT access PHI (Protected Health Information) directly. Only routes requests.
    *   *Model:* Gemini 2.5 Flash (optimized for low-latency routing).

2.  **Sub-Agents (Specialized Nodes):**
    *   **PatientAdmissionAgent:** Handles EHR updates and registration.
    *   **AppointmentSchedulingAgent:** Uses Search Grounding for doctor availability.
    *   **PharmacyManagementAgent:** Drug interaction checks and prescription drafting.
    *   **BillingAndFinanceAgent (RCM):** Financial audits, claims, and invoicing.

## 🔒 Security & Compliance (HIPAA Mandate)

This codebase implements **Compliance by Design**:

*   **Role-Based Access Control (RBAC):** Agents are isolated. The *Scheduling Agent* cannot access *Billing* data.
*   **Audit Logging:** All agent actions are logged immutably in the UI sidebar (simulated) for operational audit trails.
*   **De-identification:** The Orchestrator strips context before delegation where possible (conceptual implementation).
*   **Ephemeral State:** No PHI is stored permanently in the client-side local storage; session data clears on refresh.

## 🚀 Deployment Guide (Netlify/Vercel)

This project is configured for immediate deployment.

### Prerequisites
*   Git installed.
*   Google Gemini API Key.

### Steps
1.  **Clone & Install:**
    ```bash
    git clone <repo-url>
    npm install
    ```
2.  **Environment Variables:**
    Create a `.env` file or set in Netlify dashboard:
    ```
    API_KEY=your_google_gemini_api_key
    ```
3.  **Build:**
    ```bash
    npm run build
    ```
    *Output directory:* `dist/` or `build/`

### PWA Features
This app includes a `manifest.json` and meta tags to be installable on mobile devices as a native-like app for hospital staff.

---
*Powered by Google Gemini 2.5 & React*