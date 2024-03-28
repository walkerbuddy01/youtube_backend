import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
// import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import httpStatus from "../utils/http.status.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: complete this 
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const totalVideos = await Video.aggregate([
    {
      $match: {
        owner: _id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!totalVideos) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "No video found"));
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, totalVideos, "videos found"));

  // TODO: Get all the videos uploaded by the channel
});

export { getChannelStats, getChannelVideos };
