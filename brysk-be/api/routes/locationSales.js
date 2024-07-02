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

// Function to get display names for locations with city information
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

// Middleware to fetch and attach location display names and city info
router.use(async (req, res, next) => {
  try {
    req.locations = await getLocationsWithCities();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
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

// Helper function to enrich results with display names and sort them
const enrichWithDisplayNamesAndSort = (rows, locations, variants) => {
  const locationMap = {};
  locations.forEach((location) => {
    locationMap[location.id] = location;
  });

  const enrichedRows = rows.map((row) => ({
    ...row,
    displayName: locationMap[row.locationId]
      ? locationMap[row.locationId].displayName
      : "Unknown",
    cityName: locationMap[row.locationId]
      ? locationMap[row.locationId].cityName
      : "Unknown",
    variant_name: variants[row.variantId] ? variants[row.variantId] : "Unknown",
  }));

  return enrichedRows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
};

// Endpoint for fetching locations
router.get("/locations", async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT
        L.id,
        L."displayName",
        L."cityId",
        C.name as cityName
      FROM public."Locations" L
      JOIN public."Cities" C ON L."cityId" = C.id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for fetching cities
router.get("/cities", async (req, res) => {
  try {
    const result = await poolAdmin.query(`
      SELECT id, name
      FROM public."Cities";
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per location by day
router.get("/salesperlocation/day", async (req, res) => {
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(`
      SELECT
        O."locationId",
        DATE(O."orderAt") as sale_day,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_day
      ORDER BY sale_day DESC;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per location by week
router.get("/salesperlocation/week", async (req, res) => {
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(`
      SELECT
        O."locationId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('week', O."orderAt") as sale_week,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_year, sale_week
      ORDER BY sale_year DESC, sale_week DESC;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per location by month
router.get("/salesperlocation/month", async (req, res) => {
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(`
      SELECT
        O."locationId",
        DATE_PART('year', O."orderAt") as sale_year,
        DATE_PART('month', O."orderAt") as sale_month,
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O.status = 'paid'
      GROUP BY O."locationId", sale_year, sale_month
      ORDER BY sale_year DESC, sale_month DESC;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for sales per location by date range
router.get("/salesperlocation/daterange", async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(
      `
      SELECT
        O."locationId",
        SUM(O."totalAmount") as total_sales
      FROM public."Orders" O
      WHERE O."orderAt" BETWEEN $1 AND $2
      GROUP BY O."locationId";
    `,
      [start_date, end_date]
    );
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per location by day
router.get("/salesperlocation/sku/day", async (req, res) => {
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(`
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
      ORDER BY sale_day DESC;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per location by week
router.get("/salesperlocation/sku/week", async (req, res) => {
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(`
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
      ORDER BY sale_year DESC, sale_week DESC;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per location by month
router.get("/salesperlocation/sku/month", async (req, res) => {
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(`
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
      ORDER BY sale_year DESC, sale_month DESC;
    `);
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for SKU wise sales per location by date range
router.get("/salesperlocation/sku/daterange", async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const variants = await fetchVariantNames();
    const result = await poolCustomer.query(
      `
      SELECT
        O."locationId",
        OI."variantId",
        SUM(OI.qty) as total_quantity,
        SUM(OI."sellingPrice" * OI.qty) as total_sales
      FROM public."Orders" O
      JOIN public."OrderItems" OI ON O.id = OI."orderId"
      WHERE O."orderAt" BETWEEN $1 AND $2
      GROUP BY O."locationId", OI."variantId";
    `,
      [start_date, end_date]
    );
    const enrichedResult = enrichWithDisplayNamesAndSort(
      result.rows,
      req.locations,
      variants
    );
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
