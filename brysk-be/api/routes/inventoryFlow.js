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

// Endpoint for inventory flow at location/store/warehouse
router.get("/inventoryflow", async (req, res) => {
  const { start_date, end_date } = req.query;
  console.log("sttt", start_date, end_date);
  try {
    const result = await poolCustomer.query(
      `
     WITH date_range AS (
    SELECT 
        $1::date AS start_date, 
        $2::date AS end_date
),
-- Calculate starting inventory before the date range
starting_inventory AS (
    SELECT 
        LI."locationId",
        LI."variantId",
        SUM(CASE 
            WHEN LIL."type" IN ('inward', 'default') THEN LIL.qty 
            WHEN LIL."type" = 'outward' THEN -LIL.qty 
            ELSE 0 
        END) AS start_qty
    FROM public."LocationInventories" LI
    JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
    WHERE LIL."createdAt"::date < (SELECT start_date FROM date_range)
    GROUP BY LI."locationId", LI."variantId"
),
-- Calculate movements within the date range
inventory_movements AS (
    SELECT 
        LI."locationId",
        LI."variantId",
        SUM(CASE WHEN LIL."type" = 'inward' THEN LIL.qty ELSE 0 END) AS inward_qty,
        SUM(CASE WHEN LIL."type" = 'outward' THEN LIL.qty ELSE 0 END) AS sold_qty,
        SUM(CASE WHEN LIL."type" = 'intransit' THEN LIL.qty ELSE 0 END) AS intransit_qty,
        SUM(CASE WHEN LIL."type" = 'default' THEN LIL.qty ELSE 0 END) AS adjustment_qty
    FROM public."LocationInventories" LI
    JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
    WHERE LIL."createdAt"::date BETWEEN (SELECT start_date FROM date_range) AND (SELECT end_date FROM date_range)
    GROUP BY LI."locationId", LI."variantId"
),
-- Calculate ending inventory at the end of the date range
ending_inventory AS (
    SELECT 
        LI."locationId",
        LI."variantId",
        SUM(CASE 
            WHEN LIL."type" IN ('inward', 'default') THEN LIL.qty 
            WHEN LIL."type" = 'outward' THEN -LIL.qty 
            ELSE 0 
        END) AS end_qty
    FROM public."LocationInventories" LI
    JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
    WHERE LIL."createdAt"::date <= (SELECT end_date FROM date_range)
    GROUP BY LI."locationId", LI."variantId"
)
-- Combine everything into the final result
SELECT 
    si."locationId",
    si."variantId",
    si.start_qty,
    im.inward_qty,
    im.sold_qty,
    im.intransit_qty,
    (si.start_qty + COALESCE(im.inward_qty, 0) - COALESCE(im.sold_qty, 0) + COALESCE(im.adjustment_qty, 0)) AS end_qty,
    (si.start_qty + COALESCE(im.inward_qty, 0) - COALESCE(im.sold_qty, 0) + COALESCE(im.adjustment_qty, 0) - ei.end_qty) AS qty_loss
FROM starting_inventory si
LEFT JOIN inventory_movements im ON si."locationId" = im."locationId" AND si."variantId" = im."variantId"
LEFT JOIN ending_inventory ei ON si."locationId" = ei."locationId" AND si."variantId" = ei."variantId"
ORDER BY si."locationId", si."variantId";


      `,
      [start_date, end_date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
