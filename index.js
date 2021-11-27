const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0ttl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log(uri)
app.get('/', (req, res) => {
    res.send('Hello World!')
})
async function run() {
    try {

        await client.connect();
        const database = client.db('super-store');
        const packageCollection = database.collection('packages');
        const orderCollection = database.collection('Orders');
        const userCollection = database.collection('users');
        const reviewCollection = database.collection('reviews');
        //get product api
        app.get('/packages', async (req, res) => {
            const cursor = packageCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        app.post('/packages', async (req, res) => {
            const service = req.body;
            console.log(service)
            const result = await packageCollection.insertOne(service);
            console.log(result)
            res.json(result)
        })
        //add orders
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.json(result)
        })
        //get order
        app.get('/orders', async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query = { email: email };
            }

            const cursor = orderCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })


        app.post('/users', async (req, res) => {
            const user = req.body;

            const result = await userCollection.insertOne(user);
            res.json(result)
        })
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const option = { upsert: true }
            const update = { $set: user };
            const result = await userCollection.updateOne(filter, option, update);
            res.json(result)
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        app.post('/packages', async (req, res) => {
            const service = req.body;
            console.log(service)
            const result = await packageCollection.insertOne(service);
            console.log(result)
            res.json(result)
        })



        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user)
            const filter = { email: user.email };
            const update = { $set: { role: 'admin' } };
            const result = await userCollection.updateOne(filter, update);
            res.json(result)
        })
        //delete
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.json(result)
        })
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.json(result)
        })

        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.json(result)
        })


        //post to database
        app.post('/reviews', async (req, res) => {

            const review = req.body;
            console.log('hit the api', review)
            const result = await reviewCollection.insertOne(review);
            res.json(result)
        })
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']

            });
            res.json({ clientSecret: paymentIntent.client_secret })


        })
    }
    finally {

    }

}
run().catch(console.dir);





app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})