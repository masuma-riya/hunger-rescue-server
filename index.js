const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// mongoDB
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-wkac0pk-shard-00-00.rbwl5qc.mongodb.net:27017,ac-wkac0pk-shard-00-01.rbwl5qc.mongodb.net:27017,ac-wkac0pk-shard-00-02.rbwl5qc.mongodb.net:27017/?ssl=true&replicaSet=atlas-1019oo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db("foodDB").collection("food");
    const requestedCollection = client.db("foodDB").collection("reqFood");

    // show requested food Read operation
    app.get("/reqFood", async (req, res) => {
      const cursor = requestedCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get reqFood by email
    app.get("/reqFood/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await requestedCollection.find(query).toArray();
      res.send(result);
    });

    // get all food
    app.get("/allFood", async (req, res) => {
      const { date } = req.query;
      const cursor = foodCollection
        .find({ status: "Available" })
        .sort({ date: date || "desc" });
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single food
    app.get("/allFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    // get food by donator email
    app.get("/myFood/:email", async (req, res) => {
      // console.log(req.params.email);
      const result = await foodCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });
    // add food Create operation
    app.post("/addFood", async (req, res) => {
      const newFood = req.body;
      // console.log(newFood);
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    });

    // update a food
    app.put("/allFood/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateFood = req.body;
      const spot = {
        $set: {
          foodName: updateFood.foodName,
          quantity: updateFood.quantity,
          date: updateFood.date,
          location: updateFood.location,
          photo: updateFood.photo,
          notes: updateFood.notes,
        },
      };
      const result = await foodCollection.updateOne(filter, spot, options);
      res.send(result);
    });

    // delete my added food
    app.delete("/allFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    // add requested food
    app.put("/reqFood/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const selectedFood = await foodCollection.findOne(filter);
      const {
        foodName,
        quantity,
        date,
        location,
        photo,
        notes,
        email,
        donatorPhoto,
        donatorName,
      } = selectedFood;

      const food = {
        $set: {
          foodName,
          quantity,
          date,
          location,
          photo,
          status: "Requested",
          notes,
          email,
          donatorName,
          donatorPhoto,
        },
      };
      const updatedStatus = await foodCollection.updateOne(
        filter,
        food,
        options
      );
      if (updatedStatus.modifiedCount > 0) {
        const result = await requestedCollection.insertOne(data);
        res.send(result);
      } else {
        res.status(404).send({ message: "Request failed" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// starter
app.get("/", (req, res) => {
  res.send("Hunger Rescue Server is running on...");
});

// On local
app.listen(port, () => {
  console.log(`Hunger Rescue is running on http://localhost:${5000}`);
});
