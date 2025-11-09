
<!-- PROJECT LOGO -->
<p align="center">
  <img src="logo.png" alt="StayCasa logo" width="96"/>
</p>

<h1 align="center">StayCasa — Modern Full-Stack Hotel Booking Platform</h1>

<p align="center">
  <b>A refined, full-stack booking platform built with React, TypeScript, and Supabase — engineered for scalability, reliability, and a premium user experience.</b>
  <br/><br/>
  <a href="https://github.com/your-username/staycasa"><strong>Explore the code »</strong></a>
  <br/><br/>
  <!-- Tech Stack Badges -->
  <a href="https://react.dev">
    <img src="https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  </a>
  <a href="https://supabase.com">
    <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  </a>
  <a href="https://www.postgresql.org">
    <img src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  </a>
  <a href="https://tanstack.com/query/latest">
    <img src="https://img.shields.io/badge/State-React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white"/>
  </a>
  <br/>
  <a href="https://supabase.com/auth">
    <img src="https://img.shields.io/badge/Auth-Supabase_Auth-1E3A8A?style=for-the-badge"/>
  </a>
  <a href="https://resend.com">
    <img src="https://img.shields.io/badge/Email-Resend_API-FC5C7D?style=for-the-badge"/>
  </a>
  <a href="https://github.com/parallax/jsPDF">
    <img src="https://img.shields.io/badge/PDF-jsPDF-FFB347?style=for-the-badge"/>
  </a>
  <a href="https://react-leaflet.js.org">
    <img src="https://img.shields.io/badge/Map-React_Leaflet-32CD32?style=for-the-badge"/>
  </a>
</p>

---

## Overview

**StayCasa** is a next-generation hotel booking platform that merges aesthetic design with robust backend logic.  
It delivers real-time room availability, multi-step authentication, dynamic pricing, and automated transactional emails — all integrated into a seamless, modern UI.

StayCasa demonstrates a production-grade SaaS foundation optimized for scalability, security, and elegance.

---

## Tech Stack Overview

| Layer | Technology | Description |
|-------|-------------|--------------|
| Frontend | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) | Modular, type-safe user interface |
| Styling | [Tailwind CSS](https://tailwindcss.com) + [Framer Motion](https://www.framer.com/motion) | Scalable design system with micro-animations |
| Backend | [Supabase](https://supabase.com) (Auth + PostgreSQL + Edge Functions) | Secure, serverless backend |
| State Management | [React Query](https://tanstack.com/query/latest) | Cached asynchronous data layer |
| Validation | [Zod](https://github.com/colinhacks/zod) + [React Hook Form](https://react-hook-form.com) | Schema-based data validation |
| Email API | [Resend](https://resend.com) | Automated transactional emails |
| PDF Engine | [jsPDF](https://github.com/parallax/jsPDF) | Client-side receipt generation |
| Map Engine | [React Leaflet](https://react-leaflet.js.org) | Interactive location visualization |
| Utility | [date-fns](https://date-fns.org) | Date operations and formatting |

---

## Architecture Snapshot

```bash
staycasa/
├── src/
│   ├── components/        # Reusable UI (HotelCard, AuthForm, FilterBar)
│   ├── pages/             # Page-level routes
│   ├── layouts/           # Dashboard shells, shared structures
│   ├── lib/               # Supabase client, schemas, utilities
│   ├── data/              # TypeScript types and constants
│   └── main.tsx           # Application entry point
└── supabase/
    ├── functions/         # Edge Functions for email notifications
    └── config.toml        # Supabase project configuration
````

---

## Authentication Flows

The StayCasa authentication system uses Supabase and Framer Motion to enable seamless transitions between states.

| Flow             | Steps                        | Description                             |
| ---------------- | ---------------------------- | --------------------------------------- |
| Password Sign-In | Email + Password             | Standard authentication with validation |
| Passwordless OTP | Email → OTP Verify           | Secure, code-based login                |
| Sign-Up          | Email → OTP → Password       | Two-step sign-up with password setup    |
| Password Reset   | Logged-in & Logged-out modes | Context-aware secure reset flow         |

Real-time state updates are handled via Supabase’s `onAuthStateChange()` listener.

---

## Core Features

### Hotel Discovery

* Infinite scrolling using React Query
* Debounced search for optimized performance
* Availability filters through Supabase RPC
* Dynamic pricing engine with demand and season modifiers

### Booking Flow

* Two-phase commit booking (`pending → confirmed`)
* Mock payment simulation with success probability logic
* Confirmation email via Supabase Edge Function and Resend API

### Dashboard

* Three-tab layout: Profile / My Bookings / My Stays
* Avatar upload via Supabase Storage
* Refund logic using `differenceInHours > 48`
* Review upsert via `supabase.from('reviews').upsert()`

### Utilities

* `downloadBookingPDF()` → client-side invoice generator
* `calculatePrice()` → modular pricing engine
* `check_room_availability()` RPC → live room availability

---

## Supabase Edge Functions

| Function                | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| send-confirmation-email | Sends booking confirmation emails through Resend            |
| send-cancellation-email | Validates refund window and sends cancellation confirmation |

All functions use Deno runtime and Supabase’s `SERVICE_ROLE_KEY` for secure admin-level operations.

---

## Design Language

* **Primary Color:** `#1E3A8A`
* **Accent Color:** `#3B82F6`
* **Background:** `#FAFAFA`
* **Text:** `#111827`
* **Highlight Gradient:** `linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)`

Typography:

* Headings → `Poppins`
* Body → `Inter`
* Soft shadow accents, rounded corners, and high-contrast minimalism

---

## Testing

| Type        | Framework             | Focus                       |
| ----------- | --------------------- | --------------------------- |
| Unit        | Jest                  | Pricing engine, Zod schemas |
| Integration | React Testing Library | Booking and authentication  |
| E2E         | Cypress               | Full user journey coverage  |

---

## Deployment Setup

| Layer    | Platform            |
| -------- | ------------------- |
| Frontend | Vercel              |
| Backend  | Supabase            |
| Database | Supabase PostgreSQL |
| Email    | Resend              |
| CI/CD    | GitHub Actions      |

### Local Setup

```bash
git clone https://github.com/your-username/staycasa.git
cd staycasa
npm install
npm run dev
```

Environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RESEND_API_KEY=
```

---

## Preview

### Browse Hotels

![Browse Hotels](assets/browse-page.png)

### Booking Confirmation

![Booking Confirmation](assets/booking-confirmation.png)

### My Bookings Dashboard

![My Bookings](assets/my-bookings.png)

### My Account

![My Account](assets/account-page.png)

### Hotel Details

![Hotel Detail](assets/hotel-detail.png)

---

## Roadmap

* [ ] Stripe / Razorpay live payments
* [ ] AI-based price forecasting
* [ ] Push notifications
* [ ] Multi-language support
* [ ] PWA optimization

---

## Why StayCasa

* Built with a production-ready, enterprise-grade architecture
* Clean modular design with an elegant UI/UX approach
* Complete Supabase integration — Auth, Database, Edge Functions
* Demonstrates full-stack depth across frontend, backend, and state management
* Designed for performance, aesthetics, and scalability

---

<p align="center">
  <img src="https://img.shields.io/github/stars/your-username/staycasa?style=for-the-badge&color=1E3A8A"/>
  <img src="https://img.shields.io/github/forks/your-username/staycasa?style=for-the-badge&color=3B82F6"/>
  <img src="https://img.shields.io/github/issues/your-username/staycasa?style=for-the-badge&color=64748B"/>
</p>

---

<p align="center">
  <b>StayCasa — Book Smarter. Stay Better.</b><br/>
  <sub>Built with precision, performance, and purpose.</sub>
</p>
```

---


