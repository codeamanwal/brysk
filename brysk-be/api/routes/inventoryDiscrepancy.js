const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const poolIMS = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-ims-api",
  port: process.env.ADMIN_PGPORT,
});

const poolMachine = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-machine-api",
  port: process.env.ADMIN_PGPORT,
});

const poolAdmin = new Pool({
  host: process.env.ADMIN_PGHOST,
  user: process.env.ADMIN_PGUSER,
  password: process.env.ADMIN_PGPASSWORD,
  database: "oh-admin-api",
  port: process.env.ADMIN_PGPORT,
});

const router = express.Router();

const fetchProductNames = async () => {
  const result = await poolAdmin.query(`
    SELECT 
      "id" AS "productId",
      "name" AS "productName"
    FROM public."Products"
  `);
  console.log(result.rows)
  return result.rows;
};

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
      title AS "variant_name",
      "productId"
    FROM public."Variants"
  `);
  return result.rows;
};

const fetchLocationData = async () => {
  const result = await poolAdmin.query(`
    SELECT
      L.id AS "locationId",
      L."displayName" AS "locationName",
      L."cityId",
      C.name AS "cityName"
    FROM public."Locations" L
    JOIN public."Cities" C ON L."cityId" = C.id
  `);
  return result.rows;
};

const calculateDiscrepancy = async () => {
  const [
    locationInventories,
    scalesData,
    variantWeights,
    locationData,
    productNames,
  ] = await Promise.all([
    fetchLocationInventories(),
    fetchScalesData(),
    fetchVariantWeights(),
    fetchLocationData(),
    fetchProductNames(),
  ]);

  // console.log("Fetched Variant Weights:", variantWeights);
  // console.log("Fetched Product Names:", productNames);

  const variantWeightMap = variantWeights.reduce((acc, variant) => {
    acc[variant.variantId] = variant;
    return acc;
  }, {});

  const locationMap = locationData.reduce((acc, location) => {
    acc[location.locationId] = location;
    return acc;
  }, {});

  const scalesMap = scalesData.reduce((acc, scale) => {
    if (
      !acc[scale.variantId] ||
      new Date(scale.updatedAt) > new Date(acc[scale.variantId].updatedAt)
    ) {
      acc[scale.variantId] = scale;
    }
    return acc;
  }, {});

  const productMap = productNames.reduce((acc, product) => {
    acc[product.productId] = product.productName;
    return acc;
  }, {});

  // console.log("Variant Weight Map:", variantWeightMap);
  // console.log("Product Map:", productMap);

  const discrepancies = locationInventories.map((inventory) => {
    const scale = scalesMap[inventory.variantId];
    const variant = variantWeightMap[inventory.variantId];
    const location = locationMap[inventory.locationId];

    const sensorQuantity = scale ? scale.currentWeight / variant.unitWeight : 0;
    const discrepancy = inventory.ims_quantity - sensorQuantity;

    const productName = variant ? productMap[variant.productId] : "Unknown";
    if (productName === "Unknown") {
      console.log(`Missing product name for productId: ${variant ? variant.productId : 'N/A'}`);
    }

    return {
      locationId: inventory.locationId,
      cityId: location ? location.cityId : "Unknown",
      cityName: location ? location.cityName : "Unknown",
      locationName: location ? location.locationName : "Unknown",
      productName: productName,
      variantName: variant ? variant.variant_name : "Unknown",
      sensorQuantity: sensorQuantity.toFixed(3),
      imsQuantity: inventory.ims_quantity,
      discrepancy: discrepancy.toFixed(3),
    };
  });

  // console.log(discrepancies);
  return discrepancies;
};

router.get("/inventory-discrepancy", async (req, res) => {
  try {
    const discrepancies = await calculateDiscrepancy();
    res.json(discrepancies);
  } catch (error) {
    console.error("Error calculating discrepancy:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
