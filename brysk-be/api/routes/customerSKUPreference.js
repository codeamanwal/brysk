const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// PostgreSQL connection pool
const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-admin-api",
  port: process.env.ADMIN_PGPORT,
});

const poolCustomer = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-customer-api",
  port: process.env.ADMIN_PGPORT,
});

const fetchVariantNames = async () => {
  const result = await poolAdmin.query(`
    SELECT
      id AS "variantId",
      title AS "variant_name"
    FROM public."Variants"
  `);
  return result.rows.reduce((acc, row) => {
    acc[row.variantId] = row.variant_name;
    return acc;
  }, {});
};

const fetchUserData = async () => {
  const result = await poolCustomer.query(`
    SELECT id, name, "phoneNumber"
    FROM public."Users";
  `);
  const users = {};
  result.rows.forEach((row) => {
    users[row.id] = {
      name: row.name,
      phoneNumber: row.phoneNumber,
    };
  });
  return users;
};

const enrichWithDisplayNamesAndSort = (rows, users, variants) => {
  const enrichedRows = rows.map((row) => ({
    ...row,
    displayName: users[row.userId] ? users[row.userId].name : "Unknown",
    phoneNumber: users[row.userId] ? users[row.userId].phoneNumber : "Unknown",
    variant_name: variants[row.variantId] ? variants[row.variantId] : "Unknown",
  }));
  return enrichedRows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
};

router.get('/customerskupreference', async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    const [users, variants] = await Promise.all([
      fetchUserData(),
      fetchVariantNames(),
    ]);

    const result = await poolCustomer.query(`
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

    const enrichedData = enrichWithDisplayNamesAndSort(result.rows, users, variants);

    res.json(enrichedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
