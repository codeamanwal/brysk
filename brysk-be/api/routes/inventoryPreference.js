const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL connection pool for oh-ims-api
const poolIMS = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-ims-api",
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

const enrichWithVariantNames = (rows, variants) => {
  return rows.map((row) => ({
    ...row,
    variant_name: variants[row.variantId] ? variants[row.variantId] : "Unknown",
  }));
};

// Get Top 10 SKUs by Value
router.get("/inventorypreference/value", async (req, res) => {
  try {
    const [result, variants] = await Promise.all([
      poolIMS.query(`
        SELECT
          LI."variantId",
          SUM(LIL.qty * LIL."priceWithTax") AS total_value
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        GROUP BY LI."variantId"
        ORDER BY total_value DESC NULLS LAST
        LIMIT 10;
      `),
      fetchVariantNames(),
    ]);

    const enrichedData = enrichWithVariantNames(result.rows, variants);

    res.json(enrichedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Top 10 SKUs by Volume
router.get("/inventorypreference/volume", async (req, res) => {
  try {
    const [result, variants] = await Promise.all([
      poolIMS.query(`
        SELECT
          LI."variantId",
          SUM(LIL.qty) AS total_volume
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        GROUP BY LI."variantId"
        ORDER BY total_volume DESC NULLS LAST
        LIMIT 10;
      `),
      fetchVariantNames(),
    ]);

    const enrichedData = enrichWithVariantNames(result.rows, variants);

    res.json(enrichedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
