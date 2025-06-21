const express = require("express");
const http = require("http");
const supabase = require("./supabase");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const disasterRoutes = require("./routes/disasterRoutes");
const geocodeRoute = require("./routes/geocode");
const reportRoutes = require("./routes/reportRoutes");


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});
app.set("io", io); // Save globally for controllers

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/disasters", disasterRoutes);
app.use("/geocode", geocodeRoute);
app.use("/api/reports", reportRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
