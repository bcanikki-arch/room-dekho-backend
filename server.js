// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// require("dotenv").config();

//

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Routes
// 

// app.get("/", (req, res) => {
//   res.send("Backend running!");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const cors = require("cors");
require("dotenv").config();
 const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
const locationRoutes = require("./routes/location");
const bookmarkRoutes = require("./routes/bookmark");
const messageRoutes = require("./routes/message");
const propertyUserRoutes = require("./routes/propertyuser");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
// image folder
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/property", propertyRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/bookmark", bookmarkRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/property-user", propertyUserRoutes);
app.use("/api/user", require("./routes/auth"));

app.get("/", (req, res) => {
  res.send("Backend running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});