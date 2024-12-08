
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PROT || 5000;
const app = express();
// !                password:TJJvX39OGmgvUHxN
// !                password:Assinment_Ten

app.use(cors());
app.use(express.json());

// ! Mongodb File
// const DB_USER = process.env.DB_USER;
// const DB_PASS = process.env.DB_PASS ;
// console.log(`Your API key is: ${DB_USER }`);
// console.log(`Your API key is: ${DB_PASS }`);


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.frskr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
//  const uri =`mongodb+srv://TJJvX39OGmgvUHxN:${process.env.DB_PASS}@cluster0.frskr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.frskr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
});

async function run() {
    try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const reviewCollection = client.db("reviewDB").collection("review");
    const userCollection = client.db("userDB").collection("user");

    app.post("/addUser", async (req, res) => {
      const newReview = req.body;
      console.log(newReview);
      const resutl = await reviewCollection.insertOne(newReview);
      res.send(resutl);
    });

    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const qurey = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(qurey);
      res.send(result);
    });

    // user Details 
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("Creatin user Succecfully ", newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get reviews for the logged-in user
    app.get("/myReviews", async (req, res) => {
      const userEmail = req.query.email; // Email sent as query parameter
      if (!userEmail) {
        return res.status(400).send({ error: "User email is required" });
      }
      const query = { user_email: userEmail };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // Specific User GET
    app.get("/myReviews/:id", async (req, res) => {
      const id = req.params.id;
      const qurey = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(qurey);
      res.send(result);
    });

    app.put("/myReviews/:id",async(req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const updatedReviews = req.body
      const reviews = {
          $set:{
              coverimage: updatedReviews.coverimage,
              description: updatedReviews.description,
              gameRating: updatedReviews.gameRating,
              gameTitle: updatedReviews.gameTitle,
              publishingyear: updatedReviews.publishingyear,
            }
          }
          const result = await reviewCollection.updateOne(filter, reviews ,options)
          res.send(result)
    
        })
    
    
    
    
    
        // Specific Deleted 
        app.delete("/myReviews/:id", async (req, res) => {
      const id = req.params.id;
      const qurey = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(qurey);
      res.send(result);
    });
// find api code
// app.get("/highestRatedGames", async (req, res) => {
  //   try {
//     const limit = parseInt(req.query.limit) || 6; 
//     const result = await reviewCollection
//       .find()
//       .sort({ gameRating: -1 }) // `gameRating` অনুযায়ী সাজানো (DESC)
//       .limit(limit) // সীমাবদ্ধ সংখ্যা
//       .toArray();
//     res.send(result);
//   } catch (error) {
//     console.error("Failed to fetch highest rated games:", error);
//     res.status(500).send({ error: "Failed to fetch highest rated games" });
//   }
// });

app.get("/highestRatedGames", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6; 
    const pipeline = [
        {
        $match: {
          gameRating: { $exists: true, $ne: null } 
        }
      },
      {
        $sort: { gameRating: -1 } 
      },
      {
          $group: {
          _id: "$gameRating", 
          games: { $push: "$$ROOT" } 
        }
      },
      {
        $sort: { _id: -1 } 
      },
      {
          $project: {
              games: { $slice: ["$games", limit] } 
            }
          }
        ];
    
        const result = await reviewCollection.aggregate(pipeline).toArray();
    
    
        const topGames = result.flatMap(group => group.games).slice(0, limit);
    
        res.send(topGames); 
      } catch (error) {
    console.error("Failed to fetch highest rated games:", error);
    res.status(500).send({ error: "Failed to fetch highest rated games" });
  }
});

// watch lis

// Add Game to User Watchlist
app.post("/addToWatchlist", async (req, res) => {
  const { userEmail, game } = req.body;

  if (!userEmail || !game) {
      return res.status(400).send({ error: "User email and game details are required" });
  }

  const query = { email: userEmail }; // Find user by email
  const update = {
    $push: { watchlist: game }, // Add game to watchlist array
  };
  const result = await userCollection.updateOne(query, update);

  if (result.modifiedCount > 0) {
    res.send({ success: "Game added to watchlist successfully" });
  } else {
      res.status(404).send({ error: "User not found" });
    }
  });
  
  
// Add Game to User Watchlist
app.post("/addToWatchlist", async (req, res) => {
    const { userEmail, game } = req.body;
  
    if (!userEmail || !game) {
    return res.status(400).send({ error: "User email and game details are required" });
  }

  const query = { email: userEmail }; // Find user by email
  const update = {
      $push: { watchlist: game }, // Add game to watchlist array
  };
  const result = await userCollection.updateOne(query, update);

  if (result.modifiedCount > 0) {
    res.send({ success: "Game added to watchlist successfully" });
  } else {
      res.status(404).send({ error: "User not found" });
    }
  });
  
  // Get User Watchlist
  app.get("/getWatchlist", async (req, res) => {
  const userEmail = req.query.email; // Get the user's email from the query string
  if (!userEmail) {
      return res.status(400).send({ error: "User email is required" });
  }

  const query = { email: userEmail };
  const user = await userCollection.findOne(query);

  if (user) {
    res.send(user.watchlist); // Send back the user's watchlist
  } else {
      res.status(404).send({ error: "User not found" });
    }
  });
  
  
  
      // app.delete('/myReviews/:id', async(req, res)=>{
    //   const id = req.params.id;
    //   console.log(id);
    //   const query = {_id: new ObjectId(id)}
    //   const result = await reviewCollection.deleteOne(query)
    //   res.send(result)
    // })

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Assinment Ten is Running");
  });
  
  app.listen(port, () => {
  console.log(`Server Is Running Is Prot ${port}`);
});




