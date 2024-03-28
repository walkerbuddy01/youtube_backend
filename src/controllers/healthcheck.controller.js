// import {ApiError} from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import httpStatus from "../utils/http.status.js"


const healthcheck = asyncHandler(async (req, res) => {
    res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK,{},"OK"))
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
})

export {
    healthcheck
    }
    