import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import httpStatus from "../utils/http.status.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const queryObject = {};
  queryObject.$text = { $search: query };
  queryObject.userId = userId;

  const sortObject = {};
  //   sortBy :- date,time,channel
  //   sortType:- ascending or decending
  if (sortBy && sortType) {
    sortObject[sortBy] = Number(sortType);
  } else {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "sortby and sortType is required"
        )
      );
  }
  const queiredVideos = await Video.aggregate([
    {
      $match: queryObject,
    },
    {
      $sort: sortObject,
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  if (!queiredVideos) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "Not result found"));
  }

  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(httpStatus.OK, queiredVideos, "required video fetched")
    );

  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoFile, thumbnail } = req.files;

  if (!title || !description) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "title and description is required"
        )
      );
  }

  if (!videoFile || !thumbnail) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "video and thumbnial is required"
        )
      );
  }
  const videoLocalPath = videoFile[0]?.path;
  const thumbnailLocalPath = thumbnail[0]?.path;

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath, "Videos");
  const uploadedThumbnail = await uploadOnCloudinary(
    thumbnailLocalPath,
    "thumbnail"
  );

  if (!uploadedVideo || !uploadedThumbnail) {
    return res
      .status(httpStatus.SERVER_ERROR)
      .json(
        new ApiResponse(
          httpStatus.SERVER_ERROR,
          {},
          "Failed to upload video or thumbnail"
        )
      );
  }

  const publishedVideo = await Video.create({
    videoFile: uploadedVideo?.url,
    thumbnail: uploadedThumbnail?.url,
    owner: req.user._id,
    title,
    description,
    duration: uploadedVideo?.duration,
    views: uploadedVideo?.views,
  });

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, publishedVideo, "video published "));

  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "videoId is required"));
  }

  const requestedVideo = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              _id:0,
              fullname: 1,
              username: 1,
              email: 1,
              avatar: 1,
              coverImage: 1,
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

  if (!requestedVideo) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "Failed to fetch video"));
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, requestedVideo, " video fetched"));

  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { thumbnail } = req.file;
  const { videoId } = req.params;
  const { _id } = req.user;

  if (!thumbnail && (!title || !description)) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "title and description or thumbnail are required"
        )
      );
  }
  if (!videoId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "videoId is not found"));
  }

  if (title && description) {
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
        },
      },
      {
        new: true,
      }
    )
      .where("owner")
      .equals(_id);

    if (!updateVideo) {
      return res
        .status(httpStatus.SERVER_ERROR)
        .json(
          new ApiResponse(
            httpStatus.SERVER_ERROR,
            {},
            "Failed to update the video"
          )
        );
    }
    if (thumbnail) {
      const thumbnailLocalPath = thumbnail[0]?.path;
      const updateThumbnail = await uploadOnCloudinary(
        thumbnailLocalPath,
        thumbnail
      );

      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          $set: {
            thumbnail: updateThumbnail?.url,
          },
        },
        {
          new: true,
        }
      )
        .where("owner")
        .equals(_id);

      if (!updatedVideo) {
        return res
          .status(httpStatus.SERVER_ERROR)
          .json(
            new ApiResponse(
              httpStatus.SERVER_ERROR,
              {},
              "Failed to update the video"
            )
          );
      } else {
        return res
          .status(httpStatus.OK)
          .json(new ApiResponse(httpStatus.OK, updatedVideo, " video updated"));
      }
    }
    return res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, updatedVideo, " video updated"));
  }

  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  if (!videoId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "videoId is required"));
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId, {
    new: true,
  })
    .where("owner")
    .equals(_id);

  if (!deleteVideo) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(httpStatus.NOT_FOUND, {}, "failed to delete Video")
      );
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, deletedVideo, " video deleted"));

  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  if (!videoId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "videoId is required"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "video not found "));
  }

  const afterToggle = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!afterToggle) {
    return res
      .status(httpStatus.SERVER_ERROR)
      .json(new ApiResponse(httpStatus.SERVER_ERROR, {}, "request failed"));
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, afterToggle, "toggle successful"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
