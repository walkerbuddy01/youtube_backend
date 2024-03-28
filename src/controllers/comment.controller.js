import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import apiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import httpStatus from "../utils/http.status.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video

  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new apiError(httpStatus.NOT_FOUND, "Video not found");
  }

  const comments = await Comment.aggregatePaginate([
    {
      $match: {
        video: videoId,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
  ]);

  if (!comments) {
    throw new apiError(httpStatus.NOT_FOUND, "No comment found");
  }
  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, comments));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!content?.trim()) {
    throw new apiError(
      httpStatus.NOT_FOUND,
      "Comment is requied to publish it"
    );
  }
  const videoValidation = await Video.findById(videoId);
  if (!videoValidation) {
    throw new apiError(
      httpStatus.NOT_FOUND,
      "Video with given id is not found"
    );
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new apiError(httpStatus.SERVER_ERROR, "Comment failed to upload");
  }
  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, comment, "Comment uploaded"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const { commentId } = req.params;
  const { _id } = req.user;
 
  if (!content?.trim()) {
    throw new apiError(
      httpStatus.NOT_FOUND,
      "Comment is required for updation"
    );
  }
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    {
      new: true,
    }
  )
    .where("owner")
    .equals(_id);

  if (!comment) {
    throw new apiError(httpStatus.NOT_FOUND, "comment not found");
  }

  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(httpStatus.OK, comment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const { _id } = req.user;
  if (!commentId) {
    throw new apiError(httpStatus.NOT_FOUND, "please send the CommentId");
  }
  const commentDeletion = await Comment.deleteOne({_id:commentId})
    .where("owner")
    .equals(_id);

  if (!commentDeletion) {
    throw new apiError(httpStatus.SERVER_ERROR, "Deletion failed");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, commentDeletion, "comment deletion "));
});

export { getVideoComments, addComment, updateComment, deleteComment };
