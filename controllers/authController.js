const crypto = require('crypto');

const { promisify } = require('util');
const jwt = require("jsonwebtoken");

const catchAsync = require("../error-handlers/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};
const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
       //secure: true,
        httpOnly: true
    };
    if(process.env.NODE_ENV !== 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
};


const signup = catchAsync(async (req, res, next) => {
    const {name, email, role, password, passwordConfirm} = req.body;
    const newUser = await User.create({name, email,role, password, passwordConfirm});
    createAndSendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist.
    if(!email || !password){
        return next(new AppError(`Please provide email and password !!!`, 400)); // 400: BAD REQUEST
    }

    // 2) Check if user exists and password is correct.
    const user = await User.findOne({email}).select('+password');
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError(`Incorrect email or password`, 401)); // NOT AHTHORIZED
    }

    // 3) If everything is OK, send the json web token to the client.
    createAndSendToken(user, 200, res);
});

const protect = catchAsync( async (req, res, next) => {
    // 1) Getting token if it exists.
    const { authorization } = req.headers;
    let token;
    if(authorization && authorization.startsWith('Bearer ')){
        token = authorization.split(' ')[1];
    }
    if(!token) return next(new AppError(`You are not logged in. Please log in to get access.`, 401));

    // 2) Token verification.
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if the user still exists.
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) return next(new AppError('The user belonging to this token does no longer exist!', 401));

    // 4) Check if user changed password after the token was issued.
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE = accorder l'accé à la route protégée.
    req.user = currentUser; // it will be used at some point in the future.
    next();
})

const restrictTo = (...roles) => {
    return (req, res, next) => {
        const {role} = req.user;
        if(!roles.includes(role)) {
            return next(new AppError("You don't have permission to perform this action", 403));
        }
        next();
    };
};

const forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on postet user email.
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return next(new AppError("There is no user with this address email", 404));
    }

    // 2) Generate the random reset token.
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3) Send it to user's email.
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a patch request with your new password and confirmPassword to: ${resetUrl}.
    \nIf you didn't forget your password, please ignore this email!`;

    try{
        await sendEmail({
            email,
            subject: `Your passport reset token (valid for 10 min).`,
            message
        });
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });

    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError('There was an error sending the email. Try again later!', 500))
    }

});
const resetPassword = catchAsync( async (req, res, next) => {
    // 1) Get the user based on the token
    const {token} = req.params;
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashToken, passwordResetExpires: {$gt: Date.now()}});

    // 2) If the token has not expired and there is a current user then set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400));
    }
    const {password, passwordConfirm} = req.body;
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the current user

    // 4) Log the user in, set the JWT
    createAndSendToken(user, 200, res);
});
const updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if -the current posted password is correct
    const {password, passwordConfirm, passwordCurrent} = req.body;
    if(!(await user.correctPassword(passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong!', 401));
    }

    // 3) If so, we can update the password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save(); // await user.findByIdAndUpdate() will not be work. we should utilize the save hook :-)

    // 4) Log user in and send JWT
    createAndSendToken(user, 200, res);
});

module.exports = {signup, login, protect, restrictTo, forgotPassword, resetPassword, updatePassword};
