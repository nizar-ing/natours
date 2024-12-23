const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email'],
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        // this only works on CREATE and SAVE!!!
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Please confirm your password. Passwords are not the same!!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    // Only run this if password is actually modified.
    if(!this.isModified("password")) return next();

    // Hash the password with a cost of 12.
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field in order to not persist data by making it "undefined".
    this.passwordConfirm = undefined;

    // Pass the control to the next middleware.
    next();
});

userSchema.pre('save', function (next) {
    if(!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000; // we substruct one second to garanty this date will be before the token will be issued
    next();
});

userSchema.pre(/^find/, function (next) {
    // this point to the current query
    this.find({active: {$ne: false}});
    next();
});

// Define an instance method of our user document, which is usally available for all users documents
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if(this.passwordChangedAt){
       const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 100, 10);
       return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function (){
     const resetToken = crypto.randomBytes(32).toString('hex');
     this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
     console.log({ resetToken }, this.passwordResetToken);

     this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
     return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
