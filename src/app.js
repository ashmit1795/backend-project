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