const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

// PostgreSQL connection pool for various APIs
const poolIms = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-ims-api",
  port: process.env.ADMIN_PGPORT,
});

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

const getVariantNames = async () => {
  const result = await poolAdmin.query(`
    SELECT
      id AS "variantId",
      title AS "variantName"
    FROM public."Variants";
  `);
  return result.rows;
};

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

router.get("/sellthroughrate", async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required" });
  }

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

    const [receivedQuantitiesResult, soldQuantitiesResult, locations, variants] = await Promise.all([
      poolIms.query(receivedQuantitiesQuery, [start_date, end_date]),
      poolCustomer.query(soldQuantitiesQuery, [start_date, end_date]),
      getLocationsWithCities(),
      getVariantNames()
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
      const sell_through_rate =
        item.received_qty === 0 ? 0 : (sold_qty / item.received_qty) * 100;
      return {
        locationId: item.locationId,
        variantId: item.variantId,
        received_qty: item.received_qty,
        sold_qty,
        sell_through_rate,
      };
    });

    const enrichedSellThroughRates = enrichWithDisplayNamesAndSort(sellThroughRates, locations, variants);

    res.json(enrichedSellThroughRates.sort((a, b) => b.sell_through_rate - a.sell_through_rate));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
