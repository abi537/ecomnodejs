const { MongoClient } = require('mongodb');

const mongoURI = "mongodb://localhost:27017";  // Replace with your MongoDB URI
const dbName = "shopping";  // The name of your database

let db;

async function connectDB() {
    try {
        const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);  // Connect to the 'shopping' database
        console.log('MongoDB Connected to shopping database');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);  // Exit the app if MongoDB connection fails
    }
}

function getDB() {
    if (!db) {
        throw new Error("Database not connected");
    }
    return db;
}
   // return db;  // Return the connected database instance


module.exports = { connectDB, getDB };
