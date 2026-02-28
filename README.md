# SelfSense OS - Drone Tax Engine 🚁📊

SelfSense OS is an entirely offline, offline-first geolocation and tax calculation engine specifically designed for autonomous drone delivery services operating within New York State. It utilizes custom GeoJSON polygons to determine precise tax jurisdictions across all New York counties and NYC boroughs, calculating tax liabilities without relying on any external APIs.

## 🌟 Key Features

* **100% Offline Geoprocessing**: Powered by `Turf.js` for high-performance, local point-in-polygon checks within NY boundaries.
* **Multi-Level NY Tax Breakdown**: Granular tax calculation across four legal layers: **New York State**, **County**, **City**, and **MCTD** (Metropolitan Commuter Transportation District).
* **Advanced Analytics & Reporting**: Generate and download professionally formatted **PDF** or **CSV** reports for tax audits and financial tracking.
* **Tax-First Financial Logic**: Business-centric engine that calculates **Tax Liability** and **Net Revenue** directly from the gross collected totals.
* **Smart Input Validation**: Intelligent coordinate parsing that supports various decimal separators (dots/commas) and filters out delivery points outside New York State.
* **Deduplication Engine**: Real-time duplicate detection with user-facing alerts to prevent double-counting of identical delivery orders.
* **Real-Time Daily Tracking**: Dashboard insights that separate manual entries from bulk CSV imports for daily operation monitoring.
* **Dark Mode:**: Premium UI built with **Tailwind CSS** and **Framer Motion** for a smooth, modern administrative experience.

## 🚀 How to Run Locally (via Docker)

Running the project is incredibly simple using Docker. 

**1. Clone or extract the project repository.**
**2. Open your terminal in the root folder of the project.**
**3. Build the Docker image:**
\`\`\`bash
docker build -t selfsense-app .
\`\`\`
**4. Run the Docker container:**
\`\`\`bash
docker run -p 3000:3000 selfsense-app
\`\`\`

**5. Open the app:**
Go to [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Login Credentials
- **Email:** `admin@selfsense.com`
- **Password:** `admin`

## 🧪 How to Test
1. Log in using the credentials above.
2. Go to the **Orders** tab.
3. You can either use the **+ Manual Entry** button (try Latitude: `40.7128`, Longitude: `-74.0060`, Subtotal: `150.00`) OR upload a CSV file.

## 🛠 Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Leaflet.
- **Backend:** Node.js, Express, Better-SQLite3, Turf.js, Multer.
