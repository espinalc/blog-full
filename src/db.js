import { MongoClient } from 'mongodb';

let db;

async function connectDb(cb) {
     //Conexión:
     const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.lknyioq.mongodb.net/?retryWrites=true&w=majority`);
     await client.connect();
 
     //especificar la bbdd
     db = client.db('react-blog-db');
     cb();
}
export {db, connectDb};