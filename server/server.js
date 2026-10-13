const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const userRoutes = require("./routes/userRoutes");
const branchRoutes = require("./routes/branchRoutes");
const formRoutes = require("./routes/formRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const statusRoutes = require("./routes/statusRoutes");
const vehicleModelRoutes = require("./routes/vehicleModelRoutes");
const insuranceCompanyRoutes = require("./routes/insuranceCompanyRoutes");
const serviceAdvisorRoutes = require("./routes/serviceAdvisorRoutes");





const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL // Will be configured in Render
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/vehicle-models", vehicleModelRoutes);
app.use("/api/insurance-companies", insuranceCompanyRoutes);
app.use("/api/service-advisors", serviceAdvisorRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "MERN Form Array API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});