const express = require("express");
const http = require("http");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const { message } = require("prompt");
require("dotenv").config();
const { ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON data

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;
let bioDataCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Initialize database and collection
    db = client.db("student");
    bioDataCollection = db.collection("bioData");

    // Start the server
    http
      .createServer(async function (req, res) {
        if (req.url === "/" && req.method === "GET") {
          const bioData = await bioDataCollection.find().toArray(); // Fetch all documents
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(JSON.stringify(bioData)); // Serialize documents as JSON
          res.end();
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
        }
      })
      .listen(4000, () => {
        console.log("Server is running on http://localhost:5000");
      });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  }
}


connectDB();

// API Routes
// 0 STUDENT CHECK
app.post("/api/student_check", async (req, res) => {
  try {
    // Extract the email from the request body
    const { application_number } = req.body;
    console.log("Email received:", application_number);

    // Search for a document where the email matches
    const result = await bioDataCollection.findOne({ application_number: application_number });

    if (result) {
      res.status(200).json({ message: "Student email FOUND", id: result });
    } else {
      res.status(404).json({ message: "Email not found" });
    }
  } catch (err) {
    console.error("Error in student check API:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


// 1. Fetch all bioData
app.get("/api/biodata", async (req, res) => {
  try {
    const bioData = await bioDataCollection.find().toArray();
    res.status(200).json(bioData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bioData" });
  }
});

// 2. Add new bioData
app.post("/api/biodata", async (req, res) => {
  try {
    const newBioData = req.body;
    const result = await bioDataCollection.insertOne(newBioData);
    res.status(201).json({ message: "BioData added", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add bioData" });
  }
});

// 3. Fetch bioData by ID
app.get("/api/biodata/:_id", async (req, res) => {
  try {
    const { _id } = req.params; // Note: The parameter name should match ":_id"
    console.log("Received ID:", _id);

    if (!_id || !ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const bioData = await bioDataCollection.findOne({ _id: new ObjectId(_id) });

    if (!bioData) {
      return res.status(404).json({ error: "BioData not found" });
    }

    res.status(200).json(bioData);
  } catch (err) {
    console.error("Error fetching bioData:", err.message);
    res.status(500).json({ error: "Failed to fetch bioData" });
  }
});

// 4. Update bioData
app.put("/api/biodata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const result = await bioDataCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "BioData not found" });
    }
    res.status(200).json({ message: "BioData updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update bioData" });
  }
});

// 5. Delete bioData
app.delete("/api/biodata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await bioDataCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "BioData not found" });
    }
    res.status(200).json({ message: "BioData deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete bioData" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
