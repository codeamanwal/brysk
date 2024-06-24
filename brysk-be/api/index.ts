const express = require("express");
const cors = require("cors"); // Import the cors middleware
const { Pool } = require("pg");
require("dotenv").config();
const salesRoutes = require('./sales.js');
const customerSalesRoutes = require('./customersales.js')

const app = express();
const port = process.env.PORT || 5001;

// Enable CORS for all routes
app.use(cors());

console.log(process.env.ADMIN_PGHOST)
// Connection pool for the oh-admin-api database
const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: process.env.ADMIN_PGDATABASE,
  port: process.env.ADMIN_PGPORT,
});

// Connection pool for the oh-ims-api database
const poolIMS = new Pool({
  host: process.env.IMS_PGHOST,
  user: process.env.IMS_PGUSER,
  password: process.env.IMS_PGPASSWORD,
  database: process.env.IMS_PGDATABASE,
  port: process.env.IMS_PGPORT,
});

const corsOptions = {
  origin: "https://brysk-neon.vercel.app",
  optionsSuccessStatus: 200,
};

app.use(express.json(corsOptions));

poolAdmin.connect((err) => {
  if (err) {
    console.error('Error connecting to oh-admin-api database:', err);
  } else {
    console.log('Connected to oh-admin-api database');
  }
});

// Endpoint to get sales per location from the oh-admin-api database
app.use('/api', salesRoutes);

app.use('/api', customerSalesRoutes);

app.get("/api/salespercustomer", async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        DATE(O."orderAt") as sale_day,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_day
      ORDER BY sale_day;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data from oh-admin-api database:", error);
    res.status(500).json({ error: "Error fetching data from oh-admin-api database", details: error.message });
  }
});

// Endpoint to list all tables in the oh-ims-api database
app.get("/api/ims-tables", async (req, res) => {
  try {
    const result = await poolIMS.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tables from oh-ims-api:", error);
    res.status(500).send("Error fetching tables from oh-ims-api database");
  }
});

// Endpoint to list all tables in the oh-admin-api database
app.get("/api/admin-tables", async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tables from oh-ims-api:", error);
    res.status(500).send("Error fetching tables from oh-ims-api database");
  }
});

// Endpoint to fetch data from LocationInventories in the oh-ims-api database
app.get("/location-inventories", async (req, res) => {
  try {
    const result = await poolIMS.query(
      'SELECT * FROM public."LocationInventories"'
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data from LocationInventories:", error);
    res.status(500).send("Error fetching data from LocationInventories");
  }
});

app.get("/", async(req, res) => {
  res.send("Welcome!");
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
