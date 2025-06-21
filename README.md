# 🌐 Disaster Response Platform

A full-stack application built to manage disasters, map nearby resources, collect field reports, and display official updates. This project supports real-time updates, geospatial querying, AI-enhanced location handling, and caching to handle API rate limits.

---

## 🚀 Features

- 📍 **Create & Manage Disasters**
  - Store disaster metadata: title, description, tags, and geolocation.
  - Auto-geocoding using Gemini AI + Nominatim (OpenStreetMap).
  - Audit trail for create/update/delete actions with user attribution.

- 🌐 **AI-Powered Location Extraction**
  - Uses **Gemini AI (Google)** to extract structured location data from unstructured text.
  - Example: From "Need help in South LA near Grand Ave", it extracts `"South LA"` and geocodes it.

- 🧭 **Nearby Resources (Geospatial)**
  - Supabase PostGIS queries to return nearby resources within a 10km radius of the disaster's location.
  - Uses spatial index for fast performance.

- 📡 **Real-Time Updates**
  - Socket.IO enables instant update of disasters, resources, and social reports across clients.

- 🧵 **Social Media Feed (Mock)**
  - Real-time display of mock social posts related to disasters.
  - Filtered and cached per disaster ID.

- 🧾 **Reports Submission & Image Verification**
  - Users can submit reports with content and image URL.
  - Basic image verification and disaster association included.

- 📰 **Official Updates (Web Scraping + AI Filtering)**
  - Scrapes Red Cross press releases using Cheerio.
  - Filters updates by disaster keywords (from title, tags, and description).
  - Caches filtered results using Supabase `cache` table.

- 👥 **Mock Authentication**
  - Supports two hardcoded roles:
    - `netrunnerX` → contributor
    - `reliefAdmin` → admin
  - Injected via custom middleware (`x-user` HTTP header).

---

## 🛠 Tech Stack

### Frontend
- **React (Vite)** – Responsive UI for disasters, reports, and feeds.
- **Socket.IO client** – Real-time data push.

### Backend
- **Node.js + Express** – REST API server.
- **Socket.IO** – For push-based disaster/resource/feed updates.
- **Cheerio** – Server-side HTML scraping.
- **Axios** – HTTP requests to APIs and Red Cross.

### Database
- **Supabase** (PostgreSQL)
  - Stores all disasters, resources, reports, and cache.
  - Uses **PostGIS** for geospatial queries.
  - Caching is handled via a `cache` table with `key`, `value`, and `expires_at`.

---

## 📦 API Structure

### 📍 Disasters

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/disasters`                     | Fetch all disasters                |
| GET    | `/disasters?tag=earthquake`      | Filter disasters by tag            |
| POST   | `/disasters`                     | Create a new disaster              |
| PUT    | `/disasters/:id`                 | Update a disaster                  |
| DELETE | `/disasters/:id`                 | Delete a disaster                  |
| GET    | `/disasters/:id/resources`       | Get nearby resources               |
| GET    | `/disasters/:id/official-updates`| Get filtered official press releases|

### 📡 Geocoding (with AI)

| Method | Endpoint     | Description                          |
|--------|--------------|--------------------------------------|
| POST   | `/geocode`   | Extract location using Gemini + OSM  |

### 📡 Caching 
* Caches geocoded locations, nearby resources, social media posts, and scraped updates.

* TTL: **1 hour**

* Table: `cache`  
  | key (string)     | value (json) | expires_at (timestamp) |
  |------------------|--------------|-------------------------|
  | geocode:mumbai   | {...}        | 2025-06-19T10:00:00Z    |

## 📎 Example Workflow

1. **User enters:** “Food needed urgently in South Mumbai.”
2. `POST /geocode` → Gemini extracts `"South Mumbai"` and geocodes.
3. User submits a disaster or report with that location.
4. `/disasters/:id/resources` returns nearby mapped relief points.
5. `/disasters/:id/official-updates` fetches and filters **Red Cross updates** relevant to that disaster.

## 🤖 Cursor's Role in Project Development

### ✅ 1. Geospatial Queries (Supabase RPC)

**Use Case:**  
To locate nearby resources (shelters, help centers, etc.) within a 10km radius of a disaster’s geolocation using lat/lon and PostGIS.

**How Cursor Helped:**  
- Generated the `supabase.rpc("nearby_resources", {...})` logic.
- Helped with geospatial argument structuring (`lat`, `lon`, `radius_km`, `disaster_id`).
- Ensured strong type and format checking to avoid PostGIS errors.

**Impact:**  
Enabled accurate, fast geospatial lookups using Supabase indexes.

---

### ⚡ 2. Real-time WebSocket Events (Socket.IO)

**Use Case:**  
To broadcast disaster updates (create, update, delete) to all connected clients in real-time.

**How Cursor Helped:**  
- Generated reusable Socket.IO handlers:
  - Server: `req.io.emit("disaster_updated", {...})`
  - Client: `socket.on("disaster_updated", handler)`
- Ensured automatic list updates in `<select>` dropdowns without reload.

**Impact:**  
Improved interactivity and real-time collaboration across the app.

---

### 📦 3. Supabase Caching Logic (TTL)

**Use Case:**  
To reduce repeated API hits by caching disaster-related resources and scraped content.

**How Cursor Helped:**  
- Generated the `getOrSetCache()` pattern with TTL expiry.
- Used for:
  - `/disasters/:id/resources`
  - `/disasters/:id/official-updates`

**Impact:**  
Reduced API latency and load on Supabase and external scrapers.

## 📈 Impact of AI Usage

- 🛠 **Faster Development**: Saved approximately 30–40% development time, especially in writing backend logic like route handlers, Supabase queries, and real-time integrations.

- 🔍 **Cleaner Code**: Cursor suggested optimized, readable, and production-ready patterns that reduced redundant logic.

- 🌐 **Interoperability**: Enabled seamless integration with third-party APIs such as Google Geocoding and Gemini AI for geospatial enrichment and image verification.

- 🔁 **Reduced Rework**: Early logic validation and structure generation from Cursor reduced common backend bugs and eliminated the need for repetitive trial-and-error debugging.

**Cursor allowed this platform to evolve faster, smarter, and more reliably.**

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Supabase](https://supabase.com/) project (you'll need the URL and anon key)
- A modern browser (Chrome, Firefox, etc.)
- [Vite](https://vitejs.dev/) for frontend (or use `npm create vite@latest`)
- Optional: [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) for API testing

## 🙌 Final Note

This project is built as a demonstration of how a modern full-stack application can be used for **disaster response and coordination**, leveraging:

- 🌐 Real-time communication (Socket.IO)
- 🧠 AI-enhanced data enrichment (Gemini API for geocoding)
- 🗺️ Location-based intelligence (Supabase geospatial queries)
- 📰 Automated content aggregation (Cheerio web scraping)
- ⚙️ Practical caching and performance optimizations

### Feedback and ideas are always appreciated. Thanks!
