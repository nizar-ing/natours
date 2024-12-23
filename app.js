const express = require('express');

const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require("./utils/appError");
const globalErrorHandler = require("./error-handlers/globalErrorHandler");

const app = express();

// 1) Global Middlewares
// Set security HTTP headers
app.use(helmet());

// Development logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same @IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again later in an hour.'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));

// Data Sanitization against NoSQL queries injections
app.use(mongoSanitize());

// Data Sanitization against XSS (cross sites scripting attacks)
app.use(xss());

// Prevent paramater pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
}));

// Serving static files
app.use(express.static(`${__dirname}/public`));

/*Custom middlewares*/
// app.use((req,res,next)=>{
//     console.log('Hello from our own middleware 🖐');
//     next();
// });

// some test useful middlewares sometimes
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    next();
});

// 2) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'Fail',
    //     message: `Cannot find ${req.originalUrl} on this server!`
    // });

    // const error = new Error(`Cannot find ${req.originalUrl} on this server!`);
    // error.statusCode = 404;
    // error.status = 'Fail';

    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 3) Global Error middleware
app.use(globalErrorHandler);

module.exports = app;
