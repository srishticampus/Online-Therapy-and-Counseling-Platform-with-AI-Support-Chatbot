const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Check if URI exists
        const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!dbUri) {
            throw new Error("MONGO_URI is not defined in .env file");
        }

        const conn = await mongoose.connect(dbUri);
        console.log(`Connected to MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Stop the server if DB fails
    }
};

module.exports = connectDB;