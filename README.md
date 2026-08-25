# 🏥 MediFlow

### Real-Time Clinical Resource Transaction System

> A real-time healthcare resource orchestration platform designed to manage concurrent clinical resource requests, prevent conflicts, handle failures, and maintain a consistent operational state.

![MediFlow](https://img.shields.io/badge/MediFlow-Real--Time%20Clinical%20System-00C2FF)
![Status](https://img.shields.io/badge/Status-Prototype-success)
![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-purple)

---

## 📌 Problem Statement

Hospitals handle multiple concurrent transactions involving critical resources such as:

* 🛏️ ICU and hospital beds
* 👨‍⚕️ Doctors and specialists
* 🏥 Operation theatres
* 🩺 Medical equipment
* 🚑 Emergency services
* 🔄 Patient transfers

When multiple doctors or departments request the same resource simultaneously, traditional systems can face:

* Resource conflicts
* Double allocation
* Inconsistent system state
* Duplicate requests
* Partial transaction failures
* Difficult recovery and auditing

**MediFlow addresses these challenges by treating clinical resource allocation as a real-time distributed transaction workflow.**

---

# 🎯 Key Objectives

MediFlow focuses on:

* Real-time resource allocation
* Concurrent request handling
* Conflict detection
* Optimistic Concurrency Control (OCC)
* Priority-based allocation
* Idempotent request handling
* Distributed transaction workflows
* Saga-based failure compensation
* Event-driven communication
* Real-time notifications
* Complete auditability

---

# 👥 Role-Based Interfaces

MediFlow provides three different interfaces for different users.

## 👨‍⚕️ Doctor Portal

Doctors can:

* View assigned patients
* View patient details
* Request ICU beds and other resources
* Request operation theatres
* Request medical equipment
* Transfer patients
* Escalate emergency cases
* Track resource request status

### Example Flow

```text
Doctor Requests ICU Bed
        ↓
Transaction Created
        ↓
Resource Availability Check
        ↓
Concurrency / Version Check
        ↓
Resource Allocated or Conflict Detected
        ↓
Doctor Receives Real-Time Update
```

---

## 🧑 Patient Portal

Patients get a simplified healthcare experience.

Patients can:

* View assigned doctor
* Track treatment progress
* View bed/room details
* View appointments
* View medications
* View reports
* Submit requests
* Receive real-time notifications

Instead of showing technical transaction details, patients receive simplified updates such as:

> 🟡 Your resource request is being processed.

or:

> 🟢 Your ICU bed has been successfully assigned.

---

## 🖥️ Admin / Operations Center

The Operations Center provides complete visibility into the hospital's resource and transaction system.

Features include:

* Clinical Resource Grid
* Transaction Stream
* Concurrency Race Simulator
* Saga Recovery
* Failure & Chaos Lab
* Event Logs
* Resource Monitoring
* System Health
* Analytics

---

# ⚡ Core Features

## 🔒 Optimistic Concurrency Control

Each resource maintains a version number.

Example:

```text
ICU Bed 05
Version: 24
Status: AVAILABLE
```

If two transactions attempt to update the same resource:

```text
Transaction A → Expected Version: 24
Transaction B → Expected Version: 24
```

If Transaction A succeeds first:

```text
Resource Version → 25
```

Transaction B detects:

```text
Expected Version: 24
Actual Version: 25

❌ CONFLICT DETECTED
```

This prevents inconsistent or duplicate resource allocation.

---

## 🏁 Priority-Based Conflict Resolution

Multiple doctors may request the same resource simultaneously.

Example:

```text
Doctor A → ICU Bed 05 → HIGH
Doctor B → ICU Bed 05 → CRITICAL
Doctor C → ICU Bed 05 → NORMAL
```

The transaction system evaluates the requests according to a deterministic priority strategy.

```text
CRITICAL
   ↓
HIGH
   ↓
MEDIUM
   ↓
NORMAL
```

The selected transaction receives the resource while other requests are queued, rejected, or redirected to alternatives.

---

# 🔄 Saga-Based Failure Recovery

Complex clinical workflows may involve multiple resources.

Example:

```text
Reserve Operation Theatre     ✅
Assign Doctor                ✅
Allocate Equipment           ❌
```

Instead of leaving resources partially allocated, MediFlow triggers compensation.

```text
Equipment Allocation Failed
            ↓
Saga Compensation Started
            ↓
Release Doctor
            ↓
Release Operation Theatre
            ↓
Restore System State
            ↓
Transaction COMPENSATED
```

---

# ♻️ Idempotency

Duplicate requests should not result in duplicate allocations.

Each request can contain an idempotency key.

```text
Request 1
Idempotency-Key: IDEMP-78456
```

If the same request is sent again:

```text
Duplicate Request Detected
        ↓
Existing Request Returned
        ↓
Second Allocation Prevented
```

---

# 📡 Real-Time Event System

Important actions generate events such as:

```text
ALLOCATION_REQUESTED
RESOURCE_AVAILABLE
RESOURCE_LOCKED
RESOURCE_RESERVED
ALLOCATION_CONFIRMED
ALLOCATION_FAILED
TRANSFER_STARTED
TRANSFER_COMPLETED
COMPENSATION_STARTED
COMPENSATION_COMPLETED
DUPLICATE_REQUEST
```

These events can be streamed in real time to the:

* Doctor Portal
* Patient Portal
* Admin Operations Center

---

# 🧪 Demo Scenarios

MediFlow demonstrates four major scenarios.

## 1️⃣ Normal Allocation

```text
Doctor Requests ICU Bed
        ↓
Patient Validated
        ↓
Resource Available
        ↓
Lock Acquired
        ↓
Bed Allocated
        ↓
Event Published
        ↓
Doctor and Patient Updated
```

---

## 2️⃣ Concurrency Conflict

```text
20 Doctors
       ↓
Request Same ICU Bed
       ↓
Priority Evaluation
       ↓
Concurrency Check
       ↓
Conflict Detection
       ↓
One Winner Selected
       ↓
Others Queued / Rejected
```

---

## 3️⃣ Failure & Recovery

```text
Reserve OT           ✅
Assign Doctor        ✅
Allocate Equipment   ❌
        ↓
Saga Compensation
        ↓
Release Doctor
        ↓
Release OT
        ↓
System State Restored
```

---

## 4️⃣ Duplicate Request Handling

```text
Doctor Clicks Request Twice
        ↓
Same Idempotency Key
        ↓
Duplicate Detected
        ↓
Second Request Ignored
        ↓
Only One Allocation Occurs
```

---

# 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │   USER INTERFACES   │
                 │                     │
                 │ 👨‍⚕️ Doctor Portal   │
                 │ 🧑 Patient Portal   │
                 │ 🖥️ Admin Portal     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ API / WebSocket     │
                 │ Communication Layer │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   TRANSACTION       │
                 │   ORCHESTRATOR      │
                 │                     │
                 │ • Validation        │
                 │ • Priority          │
                 │ • OCC               │
                 │ • Idempotency       │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    Patient Service    Doctor Service    Resource Services
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                            Beds             OT           Equipment
                              │
                              ▼
                    ┌──────────────────┐
                    │ Event System     │
                    │ Audit & Replay   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Database / State │
                    └──────────────────┘
```

---

# 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* Recharts
* Lucide React

### Backend

* Node.js
* Express.js

### Real-Time Communication

* Socket.IO
* WebSockets

### Database & State

* PostgreSQL
* Redis *(optional / for distributed locking and caching)*

### Architecture & Patterns

* Event-Driven Architecture
* Transaction Orchestration
* Saga Pattern
* Optimistic Concurrency Control
* Idempotency
* Role-Based Access Control

---

# 📂 Project Structure

```text
MediFlow/
│
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── doctor/
│   │   │   ├── patient/
│   │   │   └── admin/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│
├── server/                     # Backend
│   ├── controllers/
│   ├── services/
│   │   ├── patientService/
│   │   ├── doctorService/
│   │   ├── resourceService/
│   │   └── transactionService/
│   ├── events/
│   ├── saga/
│   ├── middleware/
│   └── routes/
│
├── README.md
└── package.json
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/MediFlow.git
cd MediFlow
```

## 2. Install Dependencies

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

Open another terminal:

```bash
cd server
npm install
npm run dev
```

---

# 🌐 Application Portals

| Portal       | Route                   | Purpose                                   |
| ------------ | ----------------------- | ----------------------------------------- |
| 👨‍⚕️ Doctor | `/doctor/dashboard`     | Patient and resource management           |
| 🧑 Patient   | `/patient/dashboard`    | Treatment and request tracking            |
| 🖥️ Admin    | `/admin/command-center` | System monitoring and transaction control |

---

# 📊 Key Capabilities

| Feature                | Description                              |
| ---------------------- | ---------------------------------------- |
| Real-Time Transactions | Live processing and updates              |
| Concurrency Control    | Prevent conflicting allocations          |
| OCC Versioning         | Detect stale resource updates            |
| Priority Queue         | Handle emergency requests                |
| Saga Recovery          | Compensate failed workflows              |
| Idempotency            | Prevent duplicate allocations            |
| Event Streaming        | Real-time transaction events             |
| Audit Trail            | Track every critical action              |
| Role-Based UI          | Separate Doctor, Patient & Admin portals |
| Failure Simulation     | Test recovery under failures             |

---

# 🎯 Innovation

MediFlow does not claim to invent distributed transaction patterns.

Instead, the innovation lies in combining:

* Clinical resource allocation
* Optimistic concurrency control
* Priority-based conflict resolution
* Saga compensation
* Idempotent operations
* Event-driven communication
* Real-time role-based interfaces

into a single interactive platform.

This allows complex distributed-system concepts to be **visualized and demonstrated using real hospital resource scenarios**.

---

# 🌍 Potential Impact

### 👨‍⚕️ Doctors

Faster access to critical resources and clearer request tracking.

### 🧑 Patients

Simple and transparent updates about treatment and hospital resources.

### 🏥 Hospitals

Better utilization of limited resources and improved operational visibility.

### 🖥️ Operations Teams

Real-time monitoring, failure detection, transaction tracking, and recovery.

---

# 🔮 Future Improvements

* AI-based resource demand prediction
* Integration with actual Hospital Information Systems
* FHIR / HL7 interoperability
* Real distributed microservices deployment
* Advanced Redis-based distributed locking
* Kafka or RabbitMQ event streaming
* Predictive emergency resource allocation
* Mobile application
* Advanced security and compliance controls

---

# 👨‍💻 Team

**Project:** MediFlow
**Domain:** Healthcare & Intelligent Systems

---

## ⭐ Final Vision

> **When multiple clinical decisions compete for limited resources, MediFlow ensures that every allocation is consistent, traceable, recoverable, and visible in real time.**
