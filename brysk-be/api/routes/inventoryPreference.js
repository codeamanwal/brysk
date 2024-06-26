const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL connection pool for oh-customer-api
const poolCustomer = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-ims-api",
  port: process.env.ADMIN_PGPORT,
});

// Get Top 10 SKUs by Value
router.get("/inventorypreference/value", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        LI."variantId",
        SUM(LIL.qty * LIL."priceWithTax") AS total_value
      FROM public."LocationInventories" LI
      JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
      GROUP BY LI."variantId"
      ORDER BY total_value DESC NULLS LAST
      LIMIT 10;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Top 10 SKUs by Volume
router.get("/inventorypreference/volume", async (req, res) => {
  try {
    const result = await poolCustomer.query(`
      SELECT
        LI."variantId",
        SUM(LIL.qty) AS total_volume
      FROM public."LocationInventories" LI
      JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
      GROUP BY LI."variantId"
      ORDER BY total_volume DESC NULLS LAST
      LIMIT 10;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
