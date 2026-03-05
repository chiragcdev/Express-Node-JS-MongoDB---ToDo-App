import express from 'express';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();

// MongoDB connection details
const dbName = 'node';
const collectionName = 'todo';
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Function to connect to MongoDB and return the database instance
const connection = async () => {
    const connect = await client.connect();
    return await connect.db(dbName);
}

// EJS view engine setup
app.set('view engine', 'ejs');

// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: false })); 
app.use(express.json());

// Public path for static files (CSS, images, etc.)
const publicPath = path.resolve('public');
app.use(express.static(publicPath));

// Static paths for Bootstrap CSS and JS
app.use(express.static(path.resolve("node_modules/bootstrap/dist/css")));
app.use(express.static(path.resolve("node_modules/bootstrap/dist/js")));


// GET = Route for the home page (list of todo items)
app.get('/', async (req, resp) => {  
    const db = await connection(); // Connect to the MongoDB database
    const collection = db.collection(collectionName); // Get the todo collection from the database
    const result = await collection.find().toArray(); // Fetch all todo items from the collection 
    
    resp.render('list', { result });
});

// GET = Route for adding a new todo item
app.get('/add', (req, resp) => {
    resp.render('add');
});

// GET = Route for updating an existing todo item
app.get('/update', (req, resp) => {
    resp.render('update');
});

// POST = Redirect any requests to /update without an ID to the home page
app.post('/update', (req, resp) => {
    resp.redirect('/'); // Redirect to the home page
});


// POST = Redirect any requests to /add without an ID to the home page
app.post('/add', async (req, resp) => {
    console.log(req.body);

    const db = await connection(); // Connect to the MongoDB database
    const collection = db.collection(collectionName); // Get the todo collection from the database
    const result = await collection.insertOne(req.body); // Insert the new todo item into the collection
    if (result) {
        resp.redirect('/'); // Redirect to the home page
    } else {
        resp.redirect('/add'); // Redirect to the add page
    }
});

// GET = Route for deleting a specific todo item by ID
app.get('/delete/:id', async (req, resp) => {
    const id = req.params.id; // Get the ID of the todo item to delete from the request parameters
    const db = await connection(); // Connect to the MongoDB database
    const collection = db.collection(collectionName); // Get the todo collection from the database
    const result = await collection.deleteOne({_id: new ObjectId(id)}); // Delete the todo item with the specified ID from the collection
    if (result) {
        resp.redirect('/'); // Redirect to the home page
    } else {
        resp.send("Some Error Occurred"); // Send an error message if the deletion was unsuccessful
    }
});

// GET = Route for Populating data on existing todo item with a specific ID
app.get('/update/:id', async (req, resp) => {
    const id = req.params.id; // Get the ID of the todo item to update from the request parameters
    const db = await connection(); // Connect to the MongoDB database
    const collection = db.collection(collectionName); // Get the todo collection from the database
    const result = await collection.findOne({_id: new ObjectId(id)}); // Find the todo item with the specified ID from the collection
    if (result) {
        resp.render('update', { result }); // Render the update view with the found todo item
    } else {
        resp.send("Some Error Occurred"); // Send an error message if the item was not found
    }
});

// POST = Route for updating an existing todo item with a specific ID
app.post('/update/:id', async (req, resp) => {
    const id = req.params.id; // Get the ID of the todo item to update from the request parameters
    const db = await connection(); // Connect to the MongoDB database
    const collection = db.collection(collectionName); // Get the todo collection from the database
    const filter = {_id: new ObjectId(id)}; // Create a filter to find the todo item by ID
    const updateData = { $set: {
        title: req.body.title, // Update the title of the todo item with the value from the request body
        description: req.body.description // Update the description of the todo item with the value from the request body
    }};
    const result = await collection.updateOne(filter, updateData); // Update the todo item with the specified ID from the collection
    if (result) {
        resp.redirect("/"); // Redirect to the home page
    } else {
        resp.send("Some Error Occurred"); // Send an error message if the item was not found
    }
});

// POST = Route for deleting multiple todo items
app.post('/multi-delete', async (req, resp) => {
    const db = await connection(); // Connect to the MongoDB database
    const collection = db.collection(collectionName); // Get the todo collection from the database
    console.log(req.body.selectedTask);

    let selectedTask = undefined; // Get the selected task IDs from the request body
    if(Array.isArray(req.body.selectedTask)){
        selectedTask = req.body.selectedTask.map((id) => new ObjectId(id)); // Convert the selected task IDs to ObjectId instances
    }else {
        selectedTask = [new ObjectId(req.body.selectedTask)]; // If only one task is selected, convert it to an array with a single ObjectId instance
    }
    console.log(selectedTask);
    const result = await collection.deleteMany({_id: { $in: selectedTask }}); // Delete the todo items with the specified IDs from the collection

    if (result) {
        resp.redirect('/'); // Redirect to the home page
    } else {
        resp.send("Some Error Occurred"); // Send an error message if the deletion was unsuccessful
    }
        
});
    

app.listen(3200, () => {
  console.log('Server is running on port 3200');
});