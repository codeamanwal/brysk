const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL connection pool for oh-ims-api
const poolIMS = new Pool({
  host: process.env.IMS_PGHOST,
  user: process.env.IMS_PGUSER,
  password: process.env.IMS_PGPASSWORD,
  database: "oh-ims-api",
  port: process.env.IMS_PGPORT,
});

const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-admin-api",
  port: process.env.ADMIN_PGPORT,
});

const getLocationsWithCities = async () => {
  const result = await poolAdmin.query(`
    SELECT
      L.id,
      L."displayName",
      L."cityId",
      C.name as cityName
    FROM public."Locations" L
    JOIN public."Cities" C ON L."cityId" = C.id;
  `);
  return result.rows;
};

const getVariantNames = async () => {
  const result = await poolAdmin.query(`
    SELECT
      id AS "variantId",
      title AS "variantName"
    FROM public."Variants";
  `);
  return result.rows;
};

// Helper function to enrich results with display names, city names, and variant names, and sort them
const enrichWithDisplayNamesAndSort = (rows, locations, variants) => {
  const locationMap = {};
  locations.forEach((location) => {
    locationMap[location.id] = location;
  });

  const variantMap = {};
  variants.forEach((variant) => {
    variantMap[variant.variantId] = variant.variantName;
  });

  const enrichedRows = rows.map((row) => ({
    ...row,
    displayName: locationMap[row.locationId]
      ? locationMap[row.locationId].displayName
      : "Unknown",
    cityName: locationMap[row.locationId]
      ? locationMap[row.locationId].cityName
      : "Unknown",
    variantName: variantMap[row.variantId]
      ? variantMap[row.variantId]
      : "Unknown",
  }));

  return enrichedRows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
};

router.use(async (req, res, next) => {
  try {
    req.locations = await getLocationsWithCities();
    req.variants = await getVariantNames();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get inventory at location for a specific date
router.get("/inventory/location-store-warehouse", async (req, res) => {
  const { date } = req.query;
  console.log("date")
  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  try {
    const result = await poolIMS.query(`
      -- Calculate the starting inventory before the specific date
      WITH starting_inventory AS (
        SELECT
          LI."locationId",
          LI."variantId",
          SUM(CASE
            WHEN LIL."type" IN ('inward', 'default') THEN LIL.qty
            WHEN LIL."type" = 'outward' THEN -LIL.qty
            ELSE 0
          END) AS start_qty,
          SUM(CASE
            WHEN LIL."type" IN ('inward', 'default') THEN LIL."priceWithTax"
            WHEN LIL."type" = 'outward' THEN -LIL."priceWithTax"
            ELSE 0
          END) AS start_weight
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        WHERE LIL."createdAt" < $1::date
        GROUP BY LI."locationId", LI."variantId"
      ),
      -- Calculate the inventory movements during the specific date
      daily_movements AS (
        SELECT
          LI."locationId",
          LI."variantId",
          SUM(CASE
            WHEN LIL."type" = 'inward' THEN LIL.qty
            WHEN LIL."type" = 'outward' THEN -LIL.qty
            ELSE 0
          END) AS movement_qty,
          SUM(CASE
            WHEN LIL."type" = 'inward' THEN LIL."priceWithTax"
            WHEN LIL."type" = 'outward' THEN -LIL."priceWithTax"
            ELSE 0
          END) AS movement_weight
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        WHERE LIL."createdAt"::date = $1::date
        GROUP BY LI."locationId", LI."variantId"
      ),
      -- Calculate the ending inventory
      ending_inventory AS (
        SELECT
          si."locationId",
          si."variantId",
          si.start_qty + COALESCE(dm.movement_qty, 0) AS end_qty,
          si.start_weight + COALESCE(dm.movement_weight, 0) AS end_weight
        FROM starting_inventory si
        LEFT JOIN daily_movements dm ON si."locationId" = dm."locationId" AND si."variantId" = dm."variantId"
      )
      -- Calculate inventory loss
      SELECT
        ei."locationId",
        ei."variantId",
        si.start_qty,
        si.start_weight,
        COALESCE(dm.movement_qty, 0) AS movement_qty,
        COALESCE(dm.movement_weight, 0) AS movement_weight,
        ei.end_qty,
        ei.end_weight,
        si.start_qty + COALESCE(dm.movement_qty, 0) - ei.end_qty AS qty_loss,
        si.start_weight + COALESCE(dm.movement_weight, 0) - ei.end_weight AS weight_loss
      FROM ending_inventory ei
      JOIN starting_inventory si ON ei."locationId" = si."locationId" AND ei."variantId" = si."variantId"
      LEFT JOIN daily_movements dm ON ei."locationId" = dm."locationId" AND ei."variantId" = dm."variantId"
      ORDER BY ei."locationId", ei."variantId";
    `, [date]);

    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      req.variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error("Error fetching inventory data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
