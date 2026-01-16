import express from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import movieRoutes from './routes/movie.route.js';
import tvRoutes from './routes/tv.route.js';
import searchRoutes from './routes/search.route.js';
import watchlistRoutes from './routes/watchlist.route.js';
import { ENV_VARS } from './config/envVars.js';
console.log("MONGO URI? => ", ENV_VARS.MONGO_URI);
import { connectDB } from './config/db.js';
import cors from 'cors';
import { protectRoute } from './middleware/protectRoute.js';
import { createServer } from "http";
import { Server } from "socket.io";
import flickskyRoutes from "./routes/flicksky.route.js";





const app = express();
const PORT=ENV_VARS.PORT;
app.use(express.json());//will allow us to parse req.body
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
})); // Enable CORS for all routes
app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/movie",protectRoute,movieRoutes)
app.use("/api/v1/tv",protectRoute,tvRoutes)
app.use("/api/v1/search",protectRoute,searchRoutes)
app.use("/api/v1",protectRoute,watchlistRoutes)
app.use("/api/flicksky", flickskyRoutes);


            
// --- Socket.IO setup requires HTTP server ---
const server = createServer(app);
const io = new Server(server, {
  cors: {
   origin: "http://localhost:5173", // your React app URL
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
    console.log(`✅ Party created: ${code}`);
  });

  socket.on("joinParty", (code) => {
    if (parties[code]) {
      socket.join(code);
      parties[code].users.push(socket.id);
      io.to(code).emit("userJoined", `${socket.id} joined the party`);
    } else {
      socket.emit("errorMsg", "❌ Invalid Party Code!");
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


connectDB().then(() => {
   server.listen(PORT, () => {
      console.log(`🚀 Server started at http://localhost:${PORT}`);
   });
});






   