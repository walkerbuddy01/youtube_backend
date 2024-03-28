import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import apiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import httpStatus from "../utils/http.status.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { _id } = req.user;
  if (!name || !description) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "Name and description is required"
        )
      );
  }

  const createdPlaylist = await Playlist.create({
    name,
    description,
    owner: _id,
  });

  if (!createdPlaylist) {
    return res
      .status(httpStatus.SERVER_ERROR)
      .json(
        new ApiResponse(
          httpStatus.SERVER_ERROR,
          {},
          "Failed to create playlist"
        )
      );
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, createPlaylist, "playlist created"));

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const UserExist = await User.findById(userId.trim());

  // console.log(PlaylistExist);
  if (!UserExist) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "User is not found"));
  }
  const Allplaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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

  if (!Allplaylists) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "No playlist is found"));
  }
  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(
        httpStatus.OK,
        Allplaylists,
        "playlist fetched successfully"
      )
    );

  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const requestedPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              views: 1,
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

  if (Array.isArray(requestedPlaylist)&& requestedPlaylist.length===0) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "Playlist not found"));
  }

  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(httpStatus.OK, requestedPlaylist, "Playlist fetched")
    );
  //TODO: get playlist by id
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const { _id } = req.user;
  if (!playlistId || !videoId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "PlaylistId and videoId is required "
        )
      );
  }

  const playlist = await Playlist.findById(playlistId)
    .where("owner")
    .equals(_id);

  if (!playlist) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "No playlist is found created by this user"
        )
      );
  }

  const videoExist = await Video.findById(videoId);

  if (!videoExist) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "Video not found"));
  }

  playlist.videos = [...playlist.videos, videoId];
  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });

  if (!updatedPlaylist) {
    return res
      .status(httpStatus.SERVER_ERROR)
      .json(
        new ApiResponse(
          httpStatus.SERVER_ERROR,
          {},
          "Video could not be added due to a database error"
        )
      );
  }

  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(
        httpStatus.OK,
        updatedPlaylist,
        "Video added in the Playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !videoId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(
        new ApiResponse(
          httpStatus.NOT_FOUND,
          {},
          "playlistId and videoId are reqiured"
        )
      );
  }
  const removedVideoPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );
  if (!removedVideoPlaylist) {
    return res
      .status(httpStatus.SERVER_ERROR)
      .json(
        new ApiResponse(httpStatus.SERVER_ERROR, {}, "Failed to remove video")
      );
  }

  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(
        httpStatus.OK,
        removedVideoPlaylist,
        "video is removed from the playlist "
      )
    );

  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { _id } = req.user;

  const playlistDelete = await Playlist.findByIdAndDelete(playlistId)
    .where("owner")
    .equals(_id);

  if (!playlistDelete) {
    res
      .status(httpStatus.UNAUTHORIZED)
      .json(
        new ApiResponse(httpStatus.UNAUTHORIZED, "Playlist failed to delete")
      );
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, {}, "Playlist deleted"));
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!name?.trim() || !description?.trim()) {
    throw new apiError(
      httpStatus.NOT_FOUND,
      "name and description is required for Playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  )
    .where("owner")
    .equals(req.user._id);

  if (!updatedPlaylist) {
    throw new apiError(httpStatus.SERVER_ERROR, "Playlist failed to Upload");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, updatedPlaylist, "Playlist updated"));
  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
