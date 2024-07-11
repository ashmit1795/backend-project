import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'

export const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN, // Allow only requests from the CORS_ORIGIN
    credentials: true, //Allow sending cookies
    optionsSuccessStatus: 200 // For legacy browser support
}

app.use(cors(corsOptions));

// Parse incoming JSON payloads
app.use(express.json({
    limit: "16kb"
}));

// Parse incoming urlencoded payloads
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

// To serve static files such as images, CSS files, and JavaScript files
app.use(express.static('public'));

// Parse cookies from the incoming requests and populate req.cookies with an object keyed by the cookie names
app.use(cookieParser());

// Import routes
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import healthCheckRouter from "./routes/healthcheck.routes.js";

// Use routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/health-check", healthCheckRouter);