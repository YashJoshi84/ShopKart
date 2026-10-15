const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const customerRoutes = require("./routes/customer.routes.js");
const productRoutes = require("./routes/product.routes.js");
const orderRoutes = require("./routes/order.routes.js");

const app = express();

app.use(express.json());
app.use(cookieParser());

// Enable CORS with Credentials for cookie-based authentication
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use('/customers', customerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/api/products', productRoutes);
app.use('/orders', orderRoutes);

mongoose
  .connect(process.env.dbUrl)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.get('/', (req, res) => {
  res.send("Hello From the server");
});

app.listen(8003, () => {
  console.log('server started');
});
