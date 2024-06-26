const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const salesRoutes = require('./routes/locationSales.js');
const customerSalesRoutes = require('./routes/customerSales.js');
const inventoryAtLocationRoutes = require('./routes/inventoryAtLocation.js');
const inventoryFlowRoutes = require('./routes/inventoryFlow.js');
const numberOfBillsRouter = require('./routes/numberOfBills');
const inventoryPreference = require('./routes/inventoryPreference')
const sellThroughRateRoutes = require('./routes/sellThroughRate')
const customerSKUPreferenceRoutes = require('./routes/customerSKUPreference.js')
const inventoryDiscrepancyRoutes = require('./routes/inventoryDiscrepancy')

const app = express();
const port = process.env.PORT || 5001;

// Enable CORS for all routes
const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());


app.use('/api', salesRoutes);
app.use('/api', customerSalesRoutes);
app.use('/api', inventoryAtLocationRoutes);
app.use('/api', inventoryFlowRoutes)
app.use('/api', numberOfBillsRouter)
app.use('/api', inventoryPreference)
app.use('/api', sellThroughRateRoutes)
app.use('/api', customerSKUPreferenceRoutes)
app.use('/api', inventoryDiscrepancyRoutes)

app.get("/", async(req, res) => {
  res.send("Welcome!");
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
