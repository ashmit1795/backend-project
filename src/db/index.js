import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import express from "express";

const app = express();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("ERROR:", error);
        throw error;
    }
}

export default connectDB;