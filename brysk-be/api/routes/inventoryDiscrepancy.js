const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const poolIMS = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: 'oh-ims-api',
  port: process.env.ADMIN_PGPORT,
});

const poolMachine = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: 'oh-machine-api',
  port: process.env.ADMIN_PGPORT,
});

const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: 'oh-admin-api',
  port: process.env.ADMIN_PGPORT,
});

const router = express.Router();

const fetchLocationInventories = async () => {
  const result = await poolIMS.query(`
    SELECT 
      "locationId",
      "variantId",
      "qty" AS ims_quantity
    FROM public."LocationInventories"
  `);
  return result.rows;
};

const fetchScalesData = async () => {
  const result = await poolMachine.query(`
    SELECT
      "variantId",
      "currentWeight",
      "updatedAt"
    FROM public."Scales"
    WHERE "updatedAt" = (
      SELECT MAX("updatedAt")
      FROM public."Scales"
      WHERE "variantId" = "Scales"."variantId"
    )
  `);
  return result.rows;
};

const fetchVariantWeights = async () => {
  const result = await poolAdmin.query(`
    SELECT
      id AS "variantId",
      "unitWeight",
      title AS "variant_name"
    FROM public."Variants"
  `);
  return result.rows;
};

const fetchLocationData = async () => {
  const result = await poolAdmin.query(`
    SELECT
      id AS "locationId",
      "displayName" AS "location_name"
    FROM public."Locations"
  `);
  return result.rows;
};

const calculateDiscrepancy = async () => {
  const [locationInventories, scalesData, variantWeights, locationData] = await Promise.all([
    fetchLocationInventories(),
    fetchScalesData(),
    fetchVariantWeights(),
    fetchLocationData(),
  ]);

  const variantWeightMap = variantWeights.reduce((acc, variant) => {
    acc[variant.variantId] = variant;
    return acc;
  }, {});

  const locationMap = locationData.reduce((acc, location) => {
    acc[location.locationId] = location;
    return acc;
  }, {});

  const scalesMap = scalesData.reduce((acc, scale) => {
    if (!acc[scale.variantId] || new Date(scale.updatedAt) > new Date(acc[scale.variantId].updatedAt)) {
      acc[scale.variantId] = scale;
    }
    return acc;
  }, {});

  const discrepancies = locationInventories.map((inventory) => {
    const scale = scalesMap[inventory.variantId];
    const variant = variantWeightMap[inventory.variantId];
    const location = locationMap[inventory.locationId];

    const sensorQuantity = scale ? scale.currentWeight / variant.unitWeight : 0;
    const discrepancy = inventory.ims_quantity - sensorQuantity;

    return {
      locationName: location ? location.location_name : 'Unknown',
      variantName: variant ? variant.variant_name : 'Unknown',
      sensorQuantity: sensorQuantity.toFixed(3),
      imsQuantity: inventory.ims_quantity,
      discrepancy: discrepancy.toFixed(3),
    };
  });

  return discrepancies;
};

router.get('/inventory-discrepancy', async (req, res) => {
  try {
    const discrepancies = await calculateDiscrepancy();
    res.json(discrepancies);
  } catch (error) {
    console.error('Error calculating discrepancy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
