import 'dotenv/config';
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Main entry root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OpenContracting API Server is running"
  });
});

// Register consolidated API routes
app.use("/api", apiRoutes);

// Run express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
