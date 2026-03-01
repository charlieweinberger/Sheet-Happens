# 🚗 Sheet Happens

**Mission Control for Event Logistics & Carpool Coordination**

An intelligent event operations dashboard that transforms chaotic event signup management into a streamlined, real-time coordination experience. Built during IrvineHacks 2026.

---

## Inspiration

I faced a painful problem organizing events: **manually assigning hundreds of participants to carpool drivers** is tedious, error-prone, and wastes time. I wanted to build a command center where event organizers could:
- See all participants and drivers at a glance
- Drag-and-drop riders into car seats in seconds
- Use voice commands ("Alex in John's car") for instant reassignment
- Get AI suggestions for optimal assignments
- Sync data directly from Google Sheets

The result: 20+ minutes of manual work condensed into seconds with safety constraints intact.

---

## What It Does

A full-stack web app that combines real-time carpool visualization, drag-and-drop assignment, voice control, and AI insights into one dashboard.

### Key Features

#### 🗺️ **Real-Time Carpool Dashboard**
- Visual car layouts with drag-and-drop seat assignment
- Auto-enforced capacity constraints
- Self-driver tracking and waitlist management
- One-click auto-assignment for unassigned riders

#### 🎤 **Voice Command Control**
- Natural language commands ("Move Alex to John's car", "Alex is confirmed")
- AI-powered parsing with intent recognition
- Instant execution and full audit trail

#### 👥 **Participant Management**
- Real-time status tracking with role-based filtering
- Preferred ride partners, notes, and preferences
- Check-in and no-show tracking

#### 📊 **Dashboard & Insights**
- Live event statistics and AI-generated insights
- Approval workflows for capacity review and notes

#### 📋 **Google Sheets Integration**
- Import and real-time sync directly from sheets
- Single source of truth for participant data

#### 🔍 **Filtering & Search**
- Filter by role, officer status, and event status
- Search by name/email with multi-column sorting

---

## How We Built It

### **Tech Stack**

#### Frontend & Framework
- **Next.js 16** (React 19) – Full-stack framework with server components
- **TypeScript** – Type-safe development
- **Tailwind CSS 4** – Rapid UI development
- **Lucide React** – Icon library

#### State Management & Real-Time Updates
- **Event Store pattern** – Custom centralized state management
- Real-time data synchronization across all views

#### Drag-and-Drop
- **@dnd-kit** – Modern headless drag-and-drop library

#### Database
- **SQLite** (better-sqlite3) – Lightweight, serverless
- **Drizzle ORM** – Type-safe queries with migrations

#### Data Visualization
- **Recharts** – React charting library

#### External APIs & Services
- **Google Sheets API** – Data import and sync
- **Web Speech API** – Voice recognition
- **Custom command parser** – AI-powered interpretation

### **Architecture**

#### Database Schema
Two core tables:
1. **`participant_state`** – Personal info, roles, assignments, status, preferences, approvals
2. **`cars`** – Driver vehicles with capacity and occupancy

#### Component Architecture (Domain-Driven)
```
components/
├── carpool/           # Drag-and-drop car visualization
├── participants/      # Participant management & display
├── dashboard/         # Summary and insights
├── sheets/            # Google Sheets integration
├── shared/            # Common UI patterns
└── ui/                # Reusable UI components
```

#### Voice Command Pipeline
Capture → Transcribe → Parse (AI intent extraction) → Execute (database update) → Log & Broadcast to clients

#### Real-Time Data Flow
Google Sheets/database → EventStore → components subscribe → drag-and-drop API updates → broadcast to all clients

---

## Challenges We Ran Into

| Challenge | Why It Mattered | Solution |
|-----------|-----------------|-----------|
| **Solo project** | Teammates didn't get off the waitlist—had to handle all frontend, backend, and design alone | Focused on core features, prioritized ruthlessly, leveraged existing libraries to maximize impact |
| **Late start** | Didn't start coding until 4pm Saturday | Built fast with Next.js scaffolding and familiar tech stack; focused on MVP first |
| **Handling concurrent updates** | Multiple people using the dashboard simultaneously could cause conflicts | Implemented optimistic updates with server-side conflict resolution; used version numbers for data consistency |
| **Voice command accuracy** | Misheard commands could assign riders to wrong cars | Built fuzzy matching, disambiguation prompts, and command preview before execution |

---

## Accomplishments That We're Proud Of

1. **Complete Full-Stack Solution** – Built frontend, backend, database, and integrations from scratch in a hackathon timeline
2. **Voice-Driven UI** – Implemented AI-powered natural language parsing that understands complex carpool commands with fuzzy matching
3. **Real-Time Collaboration** – Solved concurrent update challenges with optimistic UI and server-side conflict resolution
4. **Drag-and-Drop System** – Integrated `@dnd-kit` with custom constraints for intuitive seat assignment
5. **Google Sheets Sync** – Bidirectional integration with smart debouncing to handle API rate limits gracefully
6. **Solo Delivery** – Delivered polished MVP as solo builder despite late start and teammates not attending

---

## What We Learned

### **1. Drag-and-Drop Complexity**
Native HTML5 drag-and-drop was unintuitive for touch and complex layouts. Switching to `@dnd-kit` showed me the value of specialized libraries. Lesson: don't reinvent the wheel.

### **2. Real-Time State Sync**
Syncing across components without race conditions required: single source of truth, optimistic UI updates with rollback, and event-driven broadcasting. Building this architecture upfront prevented major refactors later.

### **3. Voice Command Ambiguity**
Natural language is messy. "Move Alex to John" has multiple interpretations (which John? which Alex?). I built a resolution engine with fuzzy matching, disambiguation prompts, and learning from corrections. This taught me that UX for AI features requires graceful fallbacks.

### **4. Library Selection Matters**
Choosing the right dependencies early (Next.js, @dnd-kit, Drizzle) meant I could focus on business logic rather than reinventing wheels.

### **5. Prioritization Under Pressure**
With a late start and solo timeline, ruthless feature prioritization was essential. Focusing on the core MVP (carpool dashboard + voice commands) allowed shipping something polished rather than several unfinished features.

---

## What's Next for Sheet Happens

- **AI Survey Analysis** – Parse preference surveys to automatically detect compatible ride partners
- **Mobile App** – React Native companion for real-time mobile operations
- **SMS Notifications** – Twilio integration to notify participants of car assignments
- **Multi-Event Management** – Manage multiple concurrent events from single dashboard
- **Cost Splitting** – Built-in carpool cost calculator and Venmo integration

---

## 🤝 Contributing

Feedback and improvements welcome! Open issues or submit PRs.

---

## 📜 License

This project is open source and available under the MIT License.
