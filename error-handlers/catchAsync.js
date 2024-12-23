const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); //<=> error => next(error)
    }
};

module.exports = catchAsync;
