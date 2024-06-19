const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL connection pool
const poolAdmin = new Pool({
    host: process.env.ADMIN_PGHOST,
    user: process.env.ADMIN_PGUSER,
    password: process.env.ADMIN_PGPASSWORD,
    database: process.env.ADMIN_PGDATABASE,
    port: process.env.ADMIN_PGPORT,
});

// Endpoint for sales per location by day
router.get('/salesperlocation/day', async (req, res) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for sales per location by week
router.get('/salesperlocation/week', async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('week', O."orderAt") as sale_week,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_year, sale_week
      ORDER BY sale_year, sale_week;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for sales per location by month
router.get('/salesperlocation/month', async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('month', O."orderAt") as sale_month,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_year, sale_month
      ORDER BY sale_year, sale_month;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for sales per location by date range
router.get('/salesperlocation/daterange', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O."orderAt" BETWEEN $1 AND $2
      GROUP BY O."locationId";
    `, [start_date, end_date]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for SKU wise sales per location by day
router.get('/salesperlocation/sku/day', async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        DATE(O."orderAt") as sale_day,
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_day, OI."variantId"
      ORDER BY sale_day;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for SKU wise sales per location by week
router.get('/salesperlocation/sku/week', async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('week', O."orderAt") as sale_week,
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_year, sale_week, OI."variantId"
      ORDER BY sale_year, sale_week;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for SKU wise sales per location by month
router.get('/salesperlocation/sku/month', async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('month', O."orderAt") as sale_month,
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_year, sale_month, OI."variantId"
      ORDER BY sale_year, sale_month;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for SKU wise sales per location by date range
router.get('/salesperlocation/sku/daterange', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const result = await poolAdmin.query(`
      SELECT
        O."locationId",
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O."orderAt" BETWEEN $1 AND $2
      GROUP BY O."locationId", OI."variantId";
    `, [start_date, end_date]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
