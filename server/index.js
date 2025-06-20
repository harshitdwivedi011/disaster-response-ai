const express = require("express");
const http = require("http");
const supabase = require("./supabase");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");

const disasterRoutes = require("./routes/disasterRoutes");
const geocodeRoute = require("./routes/geocode");
const reportRoutes = require("./routes/reportRoutes");

// const mockAuth = require("./middlewares/mockAuth");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
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

// Test Supabase connection
app.get("/test-supabase", async (req, res) => {
  const { data, error } = await supabase.from("api_cache").select("*").limit(2);
  if (error) return res.status(500).json({ error: "Supabase test failed" });
  res.json({ message: "Supabase connected", data });
});

// Routes
app.use("/disasters", disasterRoutes);
app.use("/geocode", geocodeRoute);
app.use("/api/reports", reportRoutes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
