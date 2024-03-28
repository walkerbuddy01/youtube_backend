import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import apiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import httpStatus from "../utils/http.status.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const { _id } = req.user;

  if (!content?.trim()) {
    throw new apiError(httpStatus.NOT_FOUND, "Content is required for tweet");
  }

  const tweetCreated = await Tweet.create({ content, owner: _id });

  const postedTweet = await Tweet.aggregate([
    {
      $match: {
        _id: tweetCreated._id,
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
              _id: 0,
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!postedTweet) {
    throw new apiError(httpStatus.SERVER_ERROR, "Tweet failed to Upload");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, postedTweet, "tweet uploaded"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  // const tweets = await Tweet.find({ owner: userId });

  const getTweets = await Tweet.aggregate([
    {
      $match: {
        owner:new mongoose.Types.ObjectId(userId),
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
              _id: 0,
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
   
  ]);

  if (!getTweets) {
    throw new apiError("No tweet found");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, getTweets, "tweets fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content?.trim()) {
    throw new apiError(httpStatus.NOT_FOUND, "Content is required for tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    {
      new: true,
    }
  )
    .where("owner")
    .equals(req.user._id);

  if (!updatedTweet) {
    throw new apiError(httpStatus.SERVER_ERROR, "Tweet failed to Upload");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, updateTweet, "tweet updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const { _id } = req.user;

  const tweetDelete = await Tweet.findByIdAndDelete(tweetId)
    .where("owner")
    .equals(_id);

  if (!tweetDelete) {
    throw new apiError(httpStatus.SERVER_ERROR, "Tweet failed to delete");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, {}, "tweet deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
