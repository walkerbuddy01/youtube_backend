import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
// import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// import { Video } from "../models/video.model.js";
// import { User } from "../models/user.model.js";
import httpStatus from "../utils/http.status.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;
  const likedDocument = await Like.findOne({ _id });

  if (!likedDocument) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
      );
  }

  if (likedDocument.videos.includes(videoId)) {
    const likedDocument = await Like.findOneAndUpdate(
      { _id },
      {
        $pull: { videos: videoId },
      },
      {
        new: true,
      }
    );

    if (!likedDocument) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
        );
    } else {
      return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, likedDocument, "like removed"));
    }
  } else {
    const likedDocument = await Like.findOneAndUpdate(
      { _id },
      {
        $push: { videos: videoId },
      },
      {
        new: true,
      }
    );
    if (!likedDocument) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
        );
    } else {
      return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, likedDocument, "like added"));
    }
  }

  //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id } = req.user;
  const likedDocument = await Like.findOne({ _id });

  if (!likedDocument) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
      );
  }

  if (likedDocument.comments.includes(commentId)) {
    const likedDocument = await Like.findOneAndUpdate(
      { _id },
      {
        $pull: { comments: commentId },
      },
      {
        new: true,
      }
    );

    if (!likedDocument) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
        );
    } else {
      return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, likedDocument, "like removed"));
    }
  } else {
    const likedDocument = await Like.findOneAndUpdate(
      { _id },
      {
        $push: { comments: commentId },
      },
      {
        new: true,
      }
    );
    if (!likedDocument) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
        );
    } else {
      return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, likedDocument, "like added"));
    }
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { _id } = req.user;
  const likedDocument = await Like.findOne({ likedBy: _id });
  console.log(likedDocument?.tweets?.includes(tweetId));

  if (likedDocument?.tweets?.includes(tweetId)) {
    const likedDocument = await Like.findOneAndUpdate(
      { _id },
      {
        $pull: { tweets: tweetId },
      },
      {
        new: true,
      }
    );

    if (!likedDocument) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          new ApiResponse(httpStatus.NOT_FOUND, {}, "like Document not found ")
        );
    } else {
      return res
        .status(httpStatus.OK) 
        .json(new ApiResponse(httpStatus.OK, likedDocument, "like removed"));
    }
  } else {
    const likedDocument = await Like.create(
      {
        tweets:[tweetId]
      },
    );
    if (!likedDocument) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          new ApiResponse(httpStatus.NOT_FOUND, {}, "likeDocument not found ")
        );
    } else {
      return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, likedDocument, "like added"));
    }
  }
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const { _id } = req.users;
  const allLikedVideos = await Like.aggregate([
    {
      $match: {
        owner: _id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
        ],
      },
    },
  ]);

  if (!allLikedVideos) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(httpStatus.NOT_FOUND, {}, "No liked videos found ")
      );
  } else {
    return res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, allLikedVideos, "liked videos found")
      );
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
