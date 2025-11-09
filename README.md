Perfect. Here’s the **dark-mode GitHub README.md** for your project — now titled **StayCasa**.
This version is styled for *maximum visual appeal*, *badge-driven tech credibility*, and *aesthetically balanced gradients* like top-tier open-source repos.

---

````markdown
<!-- PROJECT LOGO -->
<p align="center">
  <img src="https://img.icons8.com/color/96/000000/hotel-room.png" alt="StayCasa logo" width="96"/>
</p>

<h1 align="center">🏨 StayCasa — Modern Full-Stack Hotel Booking Platform</h1>

<p align="center">
  <b>A sleek, full-stack booking platform built with React, TypeScript, and Supabase — crafted for performance, scalability, and luxury-grade user experience.</b>
  <br/>
  <br/>
  <a href="https://github.com/your-username/staycasa"><strong>Explore the code »</strong></a>
  <br/>
  <br/>
  <img src="https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/State-React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white"/>
  <br/>
  <img src="https://img.shields.io/badge/Auth-Supabase_Auth-1E3A8A?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Email-Resend_API-FC5C7D?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/PDF-jsPDF-FFB347?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Map-React_Leaflet-32CD32?style=for-the-badge"/>
</p>

---

## 🌙 Overview

**StayCasa** is a next-generation hotel booking platform designed to bridge elegant UI with powerful backend logic.  
It delivers real-time room availability, secure authentication, automated email workflows, and dynamic pricing — all built with a modern, type-safe tech stack.

StayCasa is not just a clone of hotel platforms — it’s a **production-grade SaaS blueprint** optimized for reliability, speed, and developer joy.

---

## 🎨 Tech Stack Overview

| Layer | Technology | Description |
|-------|-------------|--------------|
| **Frontend** | React 18 + TypeScript | Typed, modular UI |
| **Styling** | Tailwind CSS + Framer Motion | Atomic design & fluid animations |
| **Backend** | Supabase (Auth + PostgreSQL + Edge Functions) | Scalable BaaS backend |
| **State Management** | React Query | Cached async data layer |
| **Validation** | Zod + React Hook Form | Declarative schema-driven validation |
| **Email API** | Resend | Automated transactional emails |
| **PDF Engine** | jsPDF | Client-side receipt generation |
| **Map Engine** | React Leaflet | Interactive hotel map visualization |
| **Utility** | date-fns | Date logic and formatting |

---

## 🧠 Architecture Snapshot

```bash
staycasa/
├── src/
│   ├── components/        # Reusable UI (HotelCard, AuthForm, FilterBar)
│   ├── pages/             # Page-level routes
│   ├── layouts/           # Dashboard shells, shared structures
│   ├── lib/               # Supabase client, schemas, utilities
│   ├── data/              # Types, interfaces, constants
│   └── main.tsx           # App entry point
└── supabase/
    ├── functions/         # Edge Functions for email flows
    └── config.toml        # Supabase configuration
````

---

## 🔐 Authentication Flows

**StayCasa Auth System** uses Supabase + Framer Motion transitions for seamless UX.

| Flow                 | Steps                        | Description                      |
| -------------------- | ---------------------------- | -------------------------------- |
| **Password Sign-In** | Email + Password             | Traditional auth with validation |
| **Passwordless OTP** | Email → OTP Verify           | Secure, magic-link style login   |
| **Sign-Up**          | Email → OTP → Password       | Multi-step signup wizard         |
| **Password Reset**   | Logged-in & logged-out modes | Secure, context-aware reset flow |

All states sync in real-time via Supabase’s `onAuthStateChange()` listener.

---

## 💡 Core Features

### 🏨 Hotel Discovery

* Infinite scrolling with React Query
* Debounced smart search
* Availability filter using Supabase RPC
* Dynamic sorting and filtering

### 💳 Booking Flow

* Two-phase commit (pending → confirmed)
* Mock payment system with 80% success simulation
* Edge Function–triggered confirmation emails

### 👤 Dashboard

* Three-tab structure: Profile / Bookings / Reviews
* Profile avatar upload via Supabase Storage
* Refund eligibility logic (48-hour rule)
* Review upsert system (`supabase.from('reviews').upsert()`)

### 🧾 Utilities

* `downloadBookingPDF()` — instant invoice generator
* `calculatePrice()` — dynamic rate engine
* `check_room_availability()` RPC — real-time availability

---

## ⚙️ Supabase Edge Functions

| Function                    | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| **send-confirmation-email** | Sends booking confirmation via Resend                 |
| **send-cancellation-email** | Re-validates refund window & sends cancellation email |

All Edge Functions run on **Deno runtime**, use **SERVICE_ROLE_KEY**, and ensure client-proof integrity.

---

## 🖥️ Design Language

* **Primary Color:** `#1E3A8A`
* **Accent Color:** `#3B82F6`
* **Background:** `#0F172A` (Dark mode)
* **Text:** `#F9FAFB`
* **Highlight Gradient:** `linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)`

**Typography:**

* `Poppins` for headings
* `Inter` for body text
* Consistent rhythm, soft shadows, and smooth motion cues

---

## 🧪 Testing

| Type        | Framework             | Target                      |
| ----------- | --------------------- | --------------------------- |
| Unit        | Jest                  | Zod schemas, pricing engine |
| Integration | React Testing Library | Auth & booking flow         |
| E2E         | Cypress               | Real-world user paths       |

---

## 🛠️ Deployment Setup

| Layer    | Platform            |
| -------- | ------------------- |
| Frontend | Vercel              |
| Backend  | Supabase            |
| Database | Supabase PostgreSQL |
| Email    | Resend              |
| CI/CD    | GitHub Actions      |

### ⚡ Run Locally

```bash
# Clone repo
git clone https://github.com/your-username/staycasa.git
cd staycasa

# Install dependencies
npm install

# Run development server
npm run dev
```

Set up environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RESEND_API_KEY=
```

---

## 🧭 Roadmap

* [ ] Stripe/Razorpay live payments
* [ ] AI-powered price prediction
* [ ] Push notifications
* [ ] Multi-language localization
* [ ] PWA optimization

---

## 📸 Preview

| Home                          | Booking                             | Dashboard                               |
| ----------------------------- | ----------------------------------- | --------------------------------------- |
| ![Home](assets/home-dark.png) | ![Booking](assets/booking-dark.png) | ![Dashboard](assets/dashboard-dark.png) |

---

## 💎 Why StayCasa?

* Production-level architecture in an open-source format
* Enterprise design principles with serverless scalability
* Built to **flex your full-stack credibility**
* Proof that a booking platform can look **as elegant as it performs**

---

<p align="center">
  <img src="https://img.shields.io/github/stars/your-username/staycasa?style=for-the-badge&color=blueviolet"/>
  <img src="https://img.shields.io/github/forks/your-username/staycasa?style=for-the-badge&color=blue"/>
  <img src="https://img.shields.io/github/issues/your-username/staycasa?style=for-the-badge&color=teal"/>
</p>

---

<p align="center">
  <b>StayCasa — Book Smarter. Stay Better.</b><br/>
  <sub>Built with ❤️ using React, Supabase, and a lot of caffeine.</sub>
</p>
```

---

Would you like me to generate a **banner image** (hero-style GitHub cover: dark gradient background with “StayCasa” title + tech icons) to use at the top of your README?
It makes the repo look like a funded startup project at first glance.
