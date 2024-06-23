const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL connection pool for oh-customer-api
const poolCustomer = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-customer-api",
  port: process.env.ADMIN_PGPORT,
});

// PostgreSQL connection pool for oh-admin-api
const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-admin-api",
  port: process.env.ADMIN_PGPORT,
});

// Middleware to fetch and attach user names and display names
router.use(async (req, res, next) => {
    try {
      const result = await poolCustomer.query(`
        SELECT id, name
        FROM public."Users";
      `);
      const users = {};
      result.rows.forEach(row => {
        users[row.id] = row.name;
      });
      req.users = users;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // Helper function to enrich results with display names and sort them
  const enrichWithDisplayNamesAndSort = (rows, users) => {
    const enrichedRows = rows.map(row => ({
      ...row,
      displayName: users[row.userId] || "Unknown"
    }));
    return enrichedRows.sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

// Endpoint for sales per customer by day
router.get("/salespercustomer/day", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        O."userId",
        DATE(O."orderAt") as sale_day,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."userId", sale_day
      ORDER BY sale_day;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per customer by week
router.get("/salespercustomer/week", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        O."userId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('week', O."orderAt") as sale_week,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."userId", sale_year, sale_week
      ORDER BY sale_year, sale_week;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per customer by month
router.get("/salespercustomer/month", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        O."userId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('month', O."orderAt") as sale_month,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."userId", sale_year, sale_month
      ORDER BY sale_year, sale_month;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per customer by date range
router.get("/salespercustomer/daterange", async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await poolCustomer.query(
      `
      SELECT
        O."userId",
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O."orderAt" BETWEEN $1 AND $2
      GROUP BY O."userId";
    `,
      [start_date, end_date]
    );
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per customer by day
router.get("/salespercustomer/sku/day", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        O."userId",
        DATE(O."orderAt") as sale_day,
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O.status = 'paid'
      GROUP BY O."userId", sale_day, OI."variantId"
      ORDER BY sale_day;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per customer by week
router.get("/salespercustomer/sku/week", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        O."userId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('week', O."orderAt") as sale_week,
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O.status = 'paid'
      GROUP BY O."userId", sale_year, sale_week, OI."variantId"
      ORDER BY sale_year, sale_week;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per customer by month
router.get("/salespercustomer/sku/month", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        O."userId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('month', O."orderAt") as sale_month,
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O.status = 'paid'
      GROUP BY O."userId", sale_year, sale_month, OI."variantId"
      ORDER BY sale_year, sale_month;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per customer by date range
router.get("/salespercustomer/sku/daterange", async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await poolCustomer.query(
      `
      SELECT
        O."userId",
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O."orderAt" BETWEEN $1 AND $2
      GROUP BY O."userId", OI."variantId";
    `,
      [start_date, end_date]
    );
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.users
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
