const express = require("express");
const { Pool } = require("pg");
const { parseISO, format } = require('date-fns');
const router = express.Router();

// PostgreSQL connection pool for various APIs
const poolIms = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-ims-api",
  port: process.env.ADMIN_PGPORT,
  timezone: 'UTC'
});

const poolCustomer = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-customer-api",
  port: process.env.ADMIN_PGPORT,
  timezone: 'UTC'
});

const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-admin-api",
  port: process.env.ADMIN_PGPORT,
  timezone: 'UTC'
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
      V.id AS "variantId",
      V.title AS "variantName",
      P.name AS "productName"
    FROM public."Variants" V
    JOIN public."Products" P ON V."productId" = P.id;
  `);
  return result.rows.reduce((acc, row) => {
    acc[row.variantId] = {
      variantName: row.variantName,
      productName: row.productName
    };
    return acc;
  }, {});
};

const enrichWithDisplayNamesAndSort = (rows, locations, variants) => {
  const locationMap = {};
  locations.forEach((location) => {
    locationMap[location.id] = location;
  });

  const enrichedRows = rows.map((row) => ({
    ...row,
    displayName: locationMap[row.locationId]?.displayName || "Unknown",
    cityName: locationMap[row.locationId]?.cityName || "Unknown",
    variantName: variants[row.variantId]?.variantName || "Unknown",
    productName: variants[row.variantId]?.productName || "Unknown",
  }));

  enrichedRows.sort((a, b) => {
    if (a.sell_through_rate === null && b.sell_through_rate === null) return 0;
    if (a.sell_through_rate === null) return 1;
    if (b.sell_through_rate === null) return -1;
    return b.sell_through_rate - a.sell_through_rate;
  });

  return enrichedRows;
};

// Middleware to set time zone and load locations and variants
router.use(async (req, res, next) => {
  try {
    await poolAdmin.query(`SET TIME ZONE 'UTC'`);
    await poolIms.query(`SET TIME ZONE 'UTC'`);
    await poolCustomer.query(`SET TIME ZONE 'UTC'`);
    req.locations = await getLocationsWithCities();
    req.variants = await getVariantNames();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/sellthroughrate", async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required" });
  }

  const startDateFormatted = format(parseISO(start_date), 'yyyy-MM-dd');
  const endDateFormatted = format(parseISO(end_date), 'yyyy-MM-dd');

  try {
    const receivedQuantitiesQuery = `
      WITH received_quantities AS (
        SELECT
          LI."locationId",
          LI."variantId",
          SUM(CASE WHEN LIL."type" = 'inward' THEN LIL.qty ELSE 0 END) as received_qty
        FROM public."LocationInventories" LI
        JOIN public."LocationInventoryLogs" LIL ON LI.id = LIL."locationInventoryId"
        WHERE LIL."createdAt" BETWEEN $1 AND $2
        GROUP BY LI."locationId", LI."variantId"
      )
      SELECT * FROM received_quantities;
    `;

    const soldQuantitiesQuery = `
      WITH sold_quantities AS (
        SELECT
          O."locationId",
          OI."variantId",
          SUM(OI.qty) as sold_qty
        FROM public."Orders" O
        JOIN public."OrderItems" OI ON O.id = OI."orderId"
        WHERE O.status = 'paid'
        AND O."orderAt" BETWEEN $1 AND $2
        GROUP BY O."locationId", OI."variantId"
      )
      SELECT * FROM sold_quantities;
    `;

    const [receivedQuantitiesResult, soldQuantitiesResult] = await Promise.all([
      poolIms.query(receivedQuantitiesQuery, [startDateFormatted, endDateFormatted]),
      poolCustomer.query(soldQuantitiesQuery, [startDateFormatted, endDateFormatted])
    ]);

    const receivedQuantities = receivedQuantitiesResult.rows;
    const soldQuantities = soldQuantitiesResult.rows;

    const soldQuantitiesMap = soldQuantities.reduce((acc, item) => {
      const key = `${item.locationId}-${item.variantId}`;
      acc[key] = item.sold_qty;
      return acc;
    }, {});

    const sellThroughRates = receivedQuantities.map((item) => {
      const key = `${item.locationId}-${item.variantId}`;
      const sold_qty = soldQuantitiesMap[key] || 0;
      const sell_through_rate = item.received_qty === 0 ? null : (sold_qty / item.received_qty) * 100;
      return {
        locationId: item.locationId,
        variantId: item.variantId,
        received_qty: item.received_qty,
        sold_qty,
        sell_through_rate,
      };
    });

    const enrichedData = enrichWithDisplayNamesAndSort(sellThroughRates, req.locations, req.variants);

    res.json(enrichedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
