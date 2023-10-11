import express from 'express';
import { db, connectDb } from './db.js';
import fs from 'fs';
import admin from 'firebase-admin';
import cors from 'cors';
import path from 'path';

//Video mongo export
import 'dotenv/config.js';

// Añadido para subida
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const app = express();
app.use(express.json());
// Añadido para subida
app.use(express.static(path.join(__dirname, '../dist')));

app.use(cors( {
    origin:'http://localhost:5000',
}));

// Añadido para subida para redireccionar:
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
 });

app.use(async(req, res, next) => {
    const { authtoken } = req.headers; 

    if (authtoken){
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        } catch (e) {
            res.sendStatus(400);
        }
    }
    req.user = req.user || {};
    next();
    
})

app.get('/api/blog/:name', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('blog').findOne({name});

    if (article){
        const likeId = article.likeId || [];
        if (!likeId.includes(uid)){
            article.canLike = true;
        } else { false }

        //article.canLike = uid && !likeId.includes(uid);
        res.json(article);
        console.log(article);
    }else {
        res.sendStatus(404);
    }
})

app.use((req, res, next) => {
    if (req.user){
        next();
    } else {
        res.sendStatus(401);
    }
});

app.put('/api/blog/:name/masuno', async(req, res) =>{
    const {name} = req.params;
    const {uid} = req.user;

    const article = await db.collection('blog').findOne({name});

    console.log(uid);
    if (article){
        const likeId = article.likeId || [];
        const canLike = uid && !likeId.includes(uid);
        if (canLike) {
            await db.collection('blog').updateOne({ name }, {
      $inc: {voto: 1} ,
      $push: {likeId: uid}
    });
        }
    const updatedArticle = await db.collection('blog').findOne({name});
    res.json(updatedArticle);
    console.log(updatedArticle);
    } else {
            res.send(`El curso no existe`);
        }
    });
    
app.post('/api/blog/:name/comments', async(req, res) => {
    const { name } = req.params;
    const { texto } = req.body;
    const { email } = req.user;

    await db.collection('blog').updateOne({ name }, {
        $push: {comentario: {autor: email, texto} } ,
      });

      const article = await db.collection('blog').findOne({name});
    if (article){
        
        res.json(article)
    } else {
        res.send(`El curso no existe`);
    }
})

app.get('/hello', (req, res) => {
    console.log(req.body);
    res.send('Hola Express');
});

app.get('/user/:name/edad/:age', (req, res) =>{
    const {name, age} = req.params;
    res.send(`Hola ${name} y tienes ${age} `);
});

// Añadido para subida
const PORT = process.env.PORT || 5000

connectDb(() => {
    console.log('Conectado a la base de datos');
    app.listen(PORT, () => {
        console.log('El servidor está escuchando por el puerto ' + PORT)
    });
});

