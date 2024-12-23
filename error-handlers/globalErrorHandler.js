const AppError = require("../utils/appError");
const handleCastErrorDB = (error) => {
    const {path, value} = error;
    const message = `Invalid ${path}: ${value}.`;
    return new AppError(message, 400);
};
const handleDuplicatedFieldsDB = (error) => {
    const { name } = error.keyValue;
    //const value = keyValue.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    const message = `Duplicate fields value: '${name}'. Please enter another value.`;
    return new AppError(message, 400);
}
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};
const handleJWTokenError = () => new AppError('Invalid JWT token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Token has expired. Please log in again!', 401);


const sendErrorDev = (error, res) => {
    res.status(error.statusCode).json({
        status: error.status,
        error,
        message: error.message,
        stack: error.stack
    });
};
const sendErrorProd = (error, res) => {
    //Operational errors that means trusted errors: we have to send a message to the client.
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
        //Programming or other unknown errors: don't leak error details to the client.
    } else {
        // 1) Log the error
        console.log("ERROR 💥 ", error)
        // 2) send a generic message
        res.status(500).json({
            status: 'Error',
            message: 'Something went wrong!',
        });
    }
};

const globalErrorHandler = (error, req, res, next) => {
    error.statusCode = error.statusCode ? error.statusCode : 500;
    error.status = error.status ? error.status : 'Error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === 'production') {
        // Overriding name property because it belongs to prototype constructor.Overriding reason property to avoid formatting data issue.
        let err = { ...error, name: error.name, reason: "__ignored property__" };
        if(err.name === "CastError") err = handleCastErrorDB(error);
        if(err.code === 11000) err = handleDuplicatedFieldsDB(error);
        if(err.name === "ValidationError") err = handleValidationErrorDB(error);
        if(err.name === "JsonWebTokenError") err = handleJWTokenError();
        if(err.name === "TokenExpiredError") err = handleJWTExpiredError();
        sendErrorProd(err, res);
    }
};

module.exports = globalErrorHandler;
