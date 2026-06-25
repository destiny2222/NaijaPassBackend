import 'dotenv/config';
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000' , 'http://localhost:3001'
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
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
  console.log('Backend restarted to pick up port 3005');
});
