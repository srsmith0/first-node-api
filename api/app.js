const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

require('dotenv').config();

// do not need with graphQL
// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

const MONGODB_URI = process.env.DATABASE_PATH

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    };
}

app.use(express.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//don't need with graphQL
// app.use('/feed', feedRoutes); 
// app.use('/auth', authRoutes); 

app.use(
    '/graphql', 
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true
    })
);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data
    res.status(status).json({ message, data });
});

mongoose.connect(
    MONGODB_URI
    )
    .then(result => {
        app.listen(8080)
        //code if not using graphQL
        // const server = app.listen(8080);
        // const io = require('./socket').init(server);
        // io.on('connection', socket => {
        //     console.log('Client connected');
        // });
    })
    .catch(err => console.log(err));
