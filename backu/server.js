import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Routes
import authRoutes from "./routes/auth.route.js";
import movieRoutes from "./routes/movie.route.js";
import tvRoutes from "./routes/tv.route.js";
import searchRoutes from "./routes/search.route.js";
import watchlistRoutes from "./routes/watchlist.route.js";
import flickskyRoutes from "./routes/flicksky.route.js";
import activityRoutes from "./routes/activity.route.js";
import socialActivityRoutes from "./routes/socialActivity.route.js";
import friendsRoutes from "./routes/friends.route.js";
import userRoutes from "./routes/user.route.js";

// Config & middleware
import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import { protectRoute } from "./middleware/protectRoute.js";

// --------------------
// Path setup (ESM fix)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// App & Server
// --------------------
const app = express();
const PORT = process.env.PORT || 5000;

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// --------------------
// API Routes
// --------------------
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/movie", protectRoute, movieRoutes);
app.use("/api/v1/tv", protectRoute, tvRoutes);
app.use("/api/v1/search", protectRoute, searchRoutes);
app.use("/api/v1/watchlist", protectRoute, watchlistRoutes);

app.use("/api/flicksky", flickskyRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/social", socialActivityRoutes);
app.use("/api/v1/friends", friendsRoutes);
app.use("/api/v1/user", userRoutes);

// --------------------
// 🎯 Serve Frontend (Vite build)
// --------------------
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
});

// --------------------
// HTTP + Socket.IO
// --------------------
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// ----------------------------
// 🎥 Watch Party Feature
// ----------------------------
const parties = {};

io.on("connection", (socket) => {
  console.log("🎥 User connected:", socket.id);

  socket.on("createParty", () => {
    const code = Math.random().toString(36).substring(2, 8);
    parties[code] = { host: socket.id, users: [] };
    socket.join(code);
    socket.emit("partyCreated", code);
  });

  socket.on("joinParty", (code) => {
    if (parties[code]) {
      socket.join(code);
      parties[code].users.push(socket.id);
      io.to(code).emit("userJoined", "A user joined the party");
    } else {
      socket.emit("errorMsg", "Invalid Party Code");
    }
  });

  socket.on("videoAction", ({ code, action, currentTime }) => {
    socket.to(code).emit("syncVideo", { action, currentTime });
  });

  socket.on("chatMessage", ({ code, message, user }) => {
    io.to(code).emit("receiveMessage", { user, message });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// --------------------
// DB + Server Start
// --------------------
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("Mongo URI loaded:", !!ENV_VARS.MONGO_URI);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });
