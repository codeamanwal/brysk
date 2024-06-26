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

// Helper function to enrich results with display names and sort them
const enrichWithDisplayNamesAndSort = (rows, locations) => {
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
  }));

  return enrichedRows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
};

const queryDatabase = async (query, params, res, locations) => {
  try {
    const result = await poolCustomer.query(query, params);
    const enrichedResult = enrichWithDisplayNamesAndSort(result.rows, locations);
    res.json(enrichedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Day endpoint
router.get("/numberofbills/day", async (req, res) => {
  const query = `
    SELECT
      O."locationId",
      DATE(O."orderAt") as sale_day,
      COUNT(DISTINCT O.id) as unique_bills,
      COUNT(O.id) as total_bills,
      AVG(O."totalAmount") as average_order_value
    FROM public."Orders" O
    WHERE O.status = 'paid'
    GROUP BY O."locationId", sale_day
    ORDER BY sale_day DESC;
  `;
  await queryDatabase(query, [], res, req.locations);
});

// Week endpoint
router.get("/numberofbills/week", async (req, res) => {
  const query = `
    SELECT
      O."locationId",
      DATE_PART('year', O."orderAt") as sale_year,
      DATE_PART('week', O."orderAt") as sale_week,
      COUNT(DISTINCT O.id) as unique_bills,
      COUNT(O.id) as total_bills,
      AVG(O."totalAmount") as average_order_value
    FROM public."Orders" O
    WHERE O.status = 'paid'
    GROUP BY O."locationId", sale_year, sale_week
    ORDER BY sale_year DESC, sale_week DESC;
  `;
  await queryDatabase(query, [], res, req.locations);
});

// Month endpoint
router.get("/numberofbills/month", async (req, res) => {
  const query = `
    SELECT
      O."locationId",
      DATE_PART('year', O."orderAt") as sale_year,
      DATE_PART('month', O."orderAt") as sale_month,
      COUNT(DISTINCT O.id) as unique_bills,
      COUNT(O.id) as total_bills,
      AVG(O."totalAmount") as average_order_value
    FROM public."Orders" O
    WHERE O.status = 'paid'
    GROUP BY O."locationId", sale_year, sale_month
    ORDER BY sale_year DESC, sale_month DESC;
  `;
  await queryDatabase(query, [], res, req.locations);
});

// Date-range endpoint
router.get("/numberofbills/daterange", async (req, res) => {
  const { start_date, end_date } = req.query;
  const query = `
    SELECT
      O."locationId",
      COUNT(DISTINCT O.id) as unique_bills,
      COUNT(O.id) as total_bills,
      AVG(O."totalAmount") as average_order_value
    FROM public."Orders" O
    WHERE O.status = 'paid'
    AND O."orderAt" BETWEEN $1 AND $2
    GROUP BY O."locationId";
  `;
  await queryDatabase(query, [start_date, end_date], res, req.locations);
});

module.exports = router;
