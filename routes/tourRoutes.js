const express = require("express");
const {
    getAllTours,
    createNewTour,
    getTourById,
    deleteTourById,
    updateTourById,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
} = require("../controllers/tourController");
const {protect, restrictTo} = require("../controllers/authController");

const tourRouter = express.Router();
//tourRouter.param('id', checkId);
tourRouter.route('/top-5-cheap')
    .get(aliasTopTours, getAllTours);

tourRouter.route('/tour-stats')
    .get(getTourStats);

tourRouter.route('/monthly-plan/:year')
    .get(getMonthlyPlan);

tourRouter.route('/')
    .get(protect, getAllTours)
    .post(createNewTour);

tourRouter.route('/:id')
    .get(getTourById)
    .patch(updateTourById)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTourById);

module.exports = tourRouter;
