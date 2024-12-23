class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (matchWord) => `$${matchWord}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }
    sorting(){
        const queryObj = { ...this.queryString};
        const {sort} = queryObj;
        if(sort) {
            const sortBy = sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }else{
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    fieldsSelecting(){
        const queryObj = { ...this.queryString};
        let {fields} = queryObj;
        if(fields){
            fields = fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }else{
            this.query = this.query.select('-__v');
        }
        return this;
    }
    paginate(){
        const queryObj = { ...this.queryString};
        let { page, limit } = queryObj;
        page = page ? page * 1 : 1;
        limit = limit ? limit * 1 : 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;
