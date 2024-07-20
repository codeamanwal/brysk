const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL connection pool for oh-ims-api
const poolIMS = new Pool({
  host: process.env.IMS_PGHOST,
  user: process.env.IMS_PGUSER,
  password: process.env.IMS_PGPASSWORD,
  database: process.env.IMS_PGDATABASE,
  port: process.env.IMS_PGPORT,
});

// PostgreSQL connection pool for oh-admin-api
const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-admin-api",
  port: process.env.ADMIN_PGPORT,
});

// Function to get locations with city information
const getLocationsWithCities = async () => {
  const result = await poolAdmin.query(`
    SELECT
      L.id,
      L."displayName" AS "locationName",
      L."cityId",
      C.name AS "cityName"
    FROM public."Locations" L
    JOIN public."Cities" C ON L."cityId" = C.id;
  `);
  return result.rows;
};

// Function to get variant names along with their product names
const getVariantsWithProducts = async () => {
  const result = await poolAdmin.query(`
    SELECT
      V.id AS "variantId",
      V.title AS "variantName",
      V."productId",
      P.name AS "productName"
    FROM public."Variants" V
    JOIN public."Products" P ON V."productId" = P.id
  `);
  return result.rows.reduce((acc, row) => {
    acc[row.variantId] = {
      variantName: row.variantName,
      productName: row.productName,
    };
    return acc;
  }, {});
};

// Endpoint for inventory flow at location/store/warehouse
router.get("/inventoryflow", async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: "Start date and end date are required" });
  }

  try {
    const [locations, variants] = await Promise.all([
      getLocationsWithCities(),
      getVariantsWithProducts(),
    ]);

    const locationMap = {};
    locations.forEach((location) => {
      locationMap[location.id] = {
        locationName: location.locationName,
        cityName: location.cityName
      };
    });

    const result = await poolIMS.query(
      `
      WITH date_range AS (
        SELECT 
            $1::date AS start_date, 
            $2::date AS end_date
      ),
      -- Calculate starting inventory at the beginning of the start_date
      starting_inventory AS (
        SELECT 
            LI."locationId",
            LI."variantId",
            SUM(LIL."previousQty") AS start_qty
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        WHERE LIL."createdAt"::date = (SELECT start_date FROM date_range)
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
      -- Calculate ending inventory at the end of the end_date
      ending_inventory AS (
        SELECT 
            LI."locationId",
            LI."variantId",
            SUM(LIL."qty") AS end_qty
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        WHERE LIL."createdAt"::date = (SELECT end_date FROM date_range)
        GROUP BY LI."locationId", LI."variantId"
      )
      -- Combine everything into the final result
      SELECT 
          si."locationId",
          si."variantId",
          COALESCE(si.start_qty, 0) AS start_qty,
          COALESCE(im.inward_qty, 0) AS inward_qty,
          COALESCE(im.sold_qty, 0) AS sold_qty,
          COALESCE(im.intransit_qty, 0) AS intransit_qty,
          COALESCE(im.adjustment_qty, 0) AS adjustment_qty,
          COALESCE(ei.end_qty, 0) AS end_qty,
          (COALESCE(si.start_qty, 0) + COALESCE(im.inward_qty, 0) - COALESCE(im.sold_qty, 0) + COALESCE(im.adjustment_qty, 0) - COALESCE(ei.end_qty, 0)) AS qty_loss
      FROM starting_inventory si
      LEFT JOIN inventory_movements im ON si."locationId" = im."locationId" AND si."variantId" = im."variantId"
      LEFT JOIN ending_inventory ei ON si."locationId" = ei."locationId" AND si."variantId" = ei."variantId"
      ORDER BY si."locationId", si."variantId";
      `,
      [start_date, end_date]
    );

    const enrichedResult = result.rows.map(row => ({
      ...row,
      locationName: locationMap[row.locationId]?.locationName || 'Unknown',
      cityName: locationMap[row.locationId]?.cityName || 'Unknown',
      variantName: variants[row.variantId]?.variantName || 'Unknown',
      productName: variants[row.variantId]?.productName || 'Unknown',
      inward_qty: row.inward_qty || 0,
      sold_qty: row.sold_qty || 0,
      intransit_qty: row.intransit_qty || 0,
      adjustment_qty: row.adjustment_qty || 0,
      end_qty: row.end_qty || 0,
      qty_loss: row.qty_loss || 0,
      inventory_loss_percentage: row.start_qty ? ((row.start_qty - row.inward_qty) / row.start_qty) * 100 : 0
    }));

    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
