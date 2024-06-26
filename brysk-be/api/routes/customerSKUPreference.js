const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: process.env.ADMIN_PGDATABASE,
  port: process.env.ADMIN_PGPORT,
});

router.get('/customerskupreference', async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    const result = await pool.query(`
      WITH sku_sold AS (
        SELECT
          OI."variantId",
          COUNT(OI."variantId") AS times_sold
        FROM public."Orders" O
        JOIN public."OrderItems" OI ON O.id = OI."orderId"
        WHERE O.status = 'paid'
        AND O."orderAt" BETWEEN $1 AND $2
        GROUP BY OI."variantId"
      ),
      sku_picked AS (
        SELECT
          O."userId",
          OI."variantId",
          COUNT(OI."variantId") AS times_picked
        FROM public."Orders" O
        JOIN public."OrderItems" OI ON O.id = OI."orderId"
        WHERE O.status = 'paid'
        AND O."orderAt" BETWEEN $1 AND $2
        GROUP BY O."userId", OI."variantId"
        ORDER BY O."userId", times_picked DESC
      )
      SELECT
        sp."userId",
        sp."variantId",
        COALESCE(ss.times_sold, 0) AS times_sold,
        sp.times_picked
      FROM sku_picked sp
      LEFT JOIN sku_sold ss ON sp."variantId" = ss."variantId"
      ORDER BY sp."userId", sp."variantId";
    `, [start_date, end_date]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
