const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const betterSqlite3 = require('better-sqlite3');
const turf = require('@turf/turf');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = betterSqlite3(path.join(__dirname, '../data/database.db'));

// Оновлена таблиця з колонками source та ingested_at
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, latitude REAL, longitude REAL, subtotal REAL,
    identified_region TEXT, status TEXT, state_rate REAL, county_rate REAL, city_rate REAL, special_rates REAL,
    composite_tax_rate REAL, tax_amount REAL, total_amount REAL, source TEXT DEFAULT 'csv', ingested_at TEXT
  );
`);

// Запобіжники на випадок, якщо таблиця вже існує з минулих запусків
try { db.exec("ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'csv'"); } catch(e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN ingested_at TEXT"); } catch(e) {}
try { db.exec("UPDATE orders SET ingested_at = timestamp WHERE ingested_at IS NULL"); } catch(e) {}

const taxesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/taxes.json'), 'utf-8'));
const nycGeojson = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/new-york-city-boroughs.geojson'), 'utf-8'));
const countiesGeojson = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/new-york-counties.geojson'), 'utf-8'));

function processOrderLogic(lat, lng, subtotal) {
  const pt = turf.point([lng, lat]);
  let region = null, taxInfo = null, status = 'Verified';

  for (const feature of nycGeojson.features) {
    if (turf.booleanPointInPolygon(pt, feature)) {
      region = 'New York City';
      taxInfo = { composite_tax_rate: 0.08875, breakdown: { state_rate: 0.04, county_rate: 0, city_rate: 0.045, special_rates: 0.00375 } };
      break;
    }
  }
  if (!region) {
    for (const feature of countiesGeojson.features) {
      if (turf.booleanPointInPolygon(pt, feature)) {
        region = feature.properties.name;
        taxInfo = taxesData.find(t => t.jurisdictions.includes(region) && !t.locality.includes("(city)"));
        if (!taxInfo) taxInfo = { composite_tax_rate: 0.04, breakdown: { state_rate: 0.04, county_rate: 0, city_rate: 0, special_rates: 0 } };
        break;
      }
    }
  }

  if (!region) return { status: 'Error: Out of NY Bounds', identified_region: 'Unknown', state_rate: 0, county_rate: 0, city_rate: 0, special_rates: 0, composite_tax_rate: 0, tax_amount: 0, total_amount: subtotal };

  const tax_amount = subtotal * taxInfo.composite_tax_rate;
  return { status, identified_region: region, ...taxInfo.breakdown, composite_tax_rate: taxInfo.composite_tax_rate, tax_amount, total_amount: subtotal + tax_amount };
}

const upload = multer({ dest: 'uploads/' });

app.post('/api/orders/import', upload.single('file'), (req, res) => {
  const results = [];
  let duplicates = 0, added = 0;
  const newOrders = []; // Масив для збереження щойно доданих замовлень

  const ingested_at = new Date().toISOString(); // Фіксуємо реальний час завантаження в систему

  fs.createReadStream(req.file.path).pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const insert = db.prepare(`INSERT INTO orders (timestamp, latitude, longitude, subtotal, identified_region, status, state_rate, county_rate, city_rate, special_rates, composite_tax_rate, tax_amount, total_amount, source, ingested_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      db.transaction(() => {
        for (const row of results) {
          const lat = parseFloat(row.latitude), lng = parseFloat(row.longitude), sub = parseFloat(row.subtotal);
          
          // ЗАХИСТ ВІД БІЛОГО ЕКРАНУ: Якщо в CSV був порожній рядок, просто пропускаємо його
          if (isNaN(lat) || isNaN(lng) || isNaN(sub)) continue;

          const ts = row.timestamp || new Date().toISOString();
          
          const exists = db.prepare(`SELECT id FROM orders WHERE timestamp = ? AND latitude = ? AND longitude = ? AND subtotal = ?`).get(ts, lat, lng, sub);
          if (exists) { duplicates++; continue; }

          const tData = processOrderLogic(lat, lng, sub);
          const info = insert.run(ts, lat, lng, sub, tData.identified_region, tData.status, tData.state_rate, tData.county_rate, tData.city_rate, tData.special_rates, tData.composite_tax_rate, tData.tax_amount, tData.total_amount, 'csv', ingested_at);
          
          newOrders.push({ id: info.lastInsertRowid, timestamp: ts, latitude: lat, longitude: lng, subtotal: sub, source: 'csv', ingested_at, ...tData });
          added++;
        }
      })();
      res.json({ success: true, added, duplicates, orders: newOrders });
    });
});

app.post('/api/orders', (req, res) => {
  const { latitude, longitude, subtotal } = req.body;
  
  // Безпечний парсинг на бекенді
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const sub = parseFloat(subtotal);

  const ts = new Date().toISOString(); 
  const ingested_at = ts;

  const tData = processOrderLogic(lat, lng, sub);
  const info = db.prepare(`INSERT INTO orders (timestamp, latitude, longitude, subtotal, identified_region, status, state_rate, county_rate, city_rate, special_rates, composite_tax_rate, tax_amount, total_amount, source, ingested_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(ts, lat, lng, sub, tData.identified_region, tData.status, tData.state_rate, tData.county_rate, tData.city_rate, tData.special_rates, tData.composite_tax_rate, tData.tax_amount, tData.total_amount, 'manual', ingested_at);
  
  res.json({ success: true, order: { id: info.lastInsertRowid, timestamp: ts, latitude: lat, longitude: lng, subtotal: sub, source: 'manual', ingested_at, ...tData } });
});

app.get('/api/orders', (req, res) => res.json(db.prepare(`SELECT * FROM orders ORDER BY id DESC`).all()));

// Clear History & Reset ID Counter
app.delete('/api/orders', (req, res) => {
  db.prepare('DELETE FROM orders').run();
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name='orders'").run();
  } catch (err) {}
  res.json({ success: true, message: 'All orders deleted and ID counter reset' });
});

app.get('/api/orders/export', (req, res) => {
  const all = db.prepare('SELECT * FROM orders').all();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=selfsense_export.json');
  res.send(JSON.stringify(all, null, 2));
});

app.get('/api/geojson/nyc', (req, res) => res.sendFile(path.join(__dirname, '../data/new-york-city-boroughs.geojson')));
app.get('/api/geojson/counties', (req, res) => res.sendFile(path.join(__dirname, '../data/new-york-counties.geojson')));

// Serve Frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(3000, () => console.log('Backend running on port 3000'));