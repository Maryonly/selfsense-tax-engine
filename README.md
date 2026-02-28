# SelfSense OS - Drone Tax Engine 🚁📊

SelfSense OS is an entirely offline, offline-first geolocation and tax calculation engine for drone delivery services. It uses custom GeoJSON polygons to determine the exact tax jurisdiction of a delivery point and calculates the Gross Revenue, Tax Liability, and Net Revenue without relying on external APIs.

## 🌟 Key Features
- **100% Offline Geoprocessing:** Uses `Turf.js` for point-in-polygon checks.
- **Smart Data Ingestion:** Supports CSV bulk uploads and manual entry.
- **Deduplication Engine:** Automatically detects and ignores duplicate orders.
- **Session-based UI:** Focuses on the current upload batch for clarity.
- **Financial Analytics:** Advanced data table with dynamic PDF/CSV exports.
- **Dark Mode:** Premium UI built with Tailwind CSS & Framer Motion.

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
