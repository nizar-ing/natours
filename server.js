const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({path: `${__dirname}/config.env`});

const app = require('./app');
const port = process.env.PORT || 5000;


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB,
    {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false}
).then(() => console.log("DB connection successful"));

// 4) Start Server
app.listen(port, () => console.log(`Listening on port ${port}...`));

// This kind of error called "unhandledRejection" can occured outside of express and mongoose scope.
// to handle it we have to subscribe from the global variable 'process' to the 'unhandledRejection' event. if the error happens our process will be notified. :)
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
