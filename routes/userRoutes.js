const express = require("express");
const {getAllUsers, createNewUser, deleteUserById, getUserById, updateUserById, updateMe, deleteMe} = require("../controllers/userController");
const {signup, login, forgotPassword, resetPassword, protect, updatePassword} = require("../controllers/authController");

const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);

userRouter.post('/forgot-password', forgotPassword);
userRouter.patch('/reset-password/:token', resetPassword);
userRouter.patch('/update-me', protect, updateMe);
userRouter.delete('/delete-me', protect, deleteMe);

userRouter.patch('/update-my-password', protect, updatePassword);

userRouter.route('/')
    .get(getAllUsers)
    .post(createNewUser)

userRouter.route('/:id')
    .get(getUserById)
    .patch(updateUserById)
    .delete(deleteUserById)

module.exports = userRouter;
