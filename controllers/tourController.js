const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");
const catchAsync = require("../error-handlers/catchAsync");
const AppError = require("../utils/appError");

/*const checkId = (req, res, next, val) => {
    console.log(`Tour Id is: ${val}`);
    //const id = req.params.id * 1;
    // if(val > tours.length) {
    //     return res.status(404).json({
    //         status: 'Fail',
    //         message: 'No tours found, invalid Id',
    //     })
    // }
    next();
};*/
/*const checkBody = (req, res, next) => {
    const{body: {name, price}} = req;
    if(!name || !price ) {
        return res.status(400).json({
            status: 'Fail',
            message: 'missing name or price'
        });
    }
    next();
}*/
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

const aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

//const getAllTours = async (req, res) => {
    //try {
        // BUILD THE QUERY
        // 1-A FILTERING
        // let queryObj = { ...req.query };
        // const excludedFields = ['page', 'sort', 'limit', 'fields'];
        // excludedFields.forEach(el => delete queryObj[el]);
        // const query = Tour.find({
        //     duration: 5,
        //     difficulty: 'easy'
        // });

        // 1-B) Advanced FILTERING
        // let queryStr = JSON.stringify(queryObj);
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (matchWord) => `$${matchWord}`);
        // queryObj = JSON.parse(queryStr);

        // since the req.query = {duration: 5, difficulty: 'easy'} have the same shape as the first filter method.
        // const tours = await Tour.find(queryObj); with await here the returned query is going to be executed. for that: let's proceed as below
        // let query = Tour.find(queryObj); // we gonna retrieve only a query. we are going chain all the necessary chain queries

          // const tours = await Tour.find()
          //   .where('duration').equals(5)
          //   .where('difficulty').equals('easy');

        // 2) SORTING
        // const {sort} = req.query;
        // if(sort) {
        //     const sortBy = sort.split(',').join(' ');
        //     query = query.sort(sortBy); // sort(price ratingsAverage)
        // }else{
        //     query = query.sort('-createdAt');
        // }
        //

        // 3) Field LIMITING
        // let {fields} = req.query;
        // if(fields){
        //     fields = fields.split(',').join(' ');
        //     query = query.select(fields);
        // }else{
        //     query = query.select('-__v');
        // }

        // 4) PAGINATION   page=3&limit=10 => 1->10: page1 ; 11->20: page2 ; 21->30: page3 query = query.skip((page-1)*limit).limit(10)
        // const page = req.query.page * 1 || 1;
        // const limit = req.query.limit * 1 || 10;
        // const skip = (page - 1) * limit;
        //
        // query = query.skip(skip).limit(limit);
        // if(req.query.page){
        //     const nbTours = await Tour.countDocuments();
        //     if((skip >= nbTours) || (req.query.page * 1 <= 0)) throw new Error("This page doesn't exist!");
        // }*/

        // EXECUTE THE QUERY
    //     const apiFeatures = new APIFeatures(Tour.find(), req.query)
    //         .filter()
    //         .sorting()
    //         .fieldsSelecting()
    //         .paginate();
    //
    //     const tours = await apiFeatures.query; // then and at the end of the day we have to execute the final query.
    //     res.status(200).json(
    //         {
    //             status: 'success',
    //             results: tours.length,
    //             data: {tours}
    //         }
    //     );
    // } catch (error) {
    //     res.status(500).json({
    //         status: 'Fail',
    //         message: error.message
    //     })
    // }
//};

const getAllTours = catchAsync(async (req, res, next) => {
    // EXECUTE THE QUERY
    const apiFeatures = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sorting()
        .fieldsSelecting()
        .paginate();

    const tours = await apiFeatures.query; // then and at the end of the day we have to execute the final query.
    res.status(200).json(
        {
            status: 'success',
            results: tours.length,
            data: {tours}
        }
    );
});

const getTourById = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id); // <=> Tour.findOne({_id: req.params.id})
    if(!tour){
        // we should use return here in order to finish this current middleware immediately. We cannot have 2 responses in a single pipeline cycle.
        return next(new AppError(`No Tour found with this ID: ${req.params.id}`, 404));
    }
    res.status(200).json(
        {
            status: 'success',
            data: {tour}
        }
    );
});

/*const createNewTour = async (req, res) => {
    try {
        // const newTour = new Tour({});
        // newTour.save();
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'Fail',
            message: error.message,
        });
    }
};*/

const createNewTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    })
});

const updateTourById = catchAsync(async (req, res, next) => {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
    if(!tour){
        return next(new AppError(`No Tour found with this ID: ${req.params.id}`, 404));
    }
    res.status(200).json(
        {
            status: 'success',
            data: {
                tour: updatedTour
            }
        }
    );
});

const deleteTourById = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if(!tour){
        return next(new AppError(`No Tour found with this ID: ${req.params.id}`, 404));
    }
    res.status(204).json(
        {
            status: 'success',
            data: null
        }
    );
});

const getTourStats = catchAsync(async (req, res, next) => {
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte: 4.5}}
            },
            {
                $group: {
                    // _id: '$difficulty',
                    _id: {$toUpper: '$difficulty'},
                    nbTours: {$sum: 1},
                    nbRatings: {$sum: '$ratingsQuantity'},
                    avgRating: {$avg: '$ratingsAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'},
                }
            },
            {
                $sort: {avgPrice: -1}
            },
            // {
            //     $match: {_id: {$ne: 'EASY'}}
            // }
        ]);
        res.status(200).json(
            {
                status: 'success',
                data: {stats}
            }
        );
})

const getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = +req.params.year;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: {$month: '$startDates'},
                    nbToursStart: {$sum: 1},
                    tours: {$push: '$name'}
                }
            },
            {
                $addFields: {month: '$_id'},
            },
            {
                $project: {_id: 0}
            },
            {
                $sort: {nbToursStart: -1}
            },
            // {
            //     $limit: 1
            // }
        ]);

        res.status(200).json(
            {
                status: 'success',
                data: {plan}
            }
        );
})

module.exports = {
    getAllTours,
    getTourById,
    createNewTour,
    updateTourById,
    deleteTourById,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
};
