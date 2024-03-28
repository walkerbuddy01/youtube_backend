import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
// import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import httpStatus from "../utils/http.status.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { _id } = req.user;

  if (!channelId) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "channelId "));
  }

  const checkedForm = await Subscription.findOne({ channel: channelId })
    .where("subscriber")
    .equals(_id);

  if (!checkedForm) {
    const subscribed = await Subscription.create({
      subscriber: _id,
      channel: channelId,
    });

    if (!subscribed) {
      return res
        .status(httpStatus.SERVER_ERROR)
        .json(
          httpStatus.SERVER_ERROR,
          {},
          "Failed to subscribing this channel"
        );
    } else {
      return res
        .status(httpStatus.OK)
        .json(
          new ApiResponse(httpStatus.OK, subscribed, "Subscribed successfully")
        );
    }
  } else {
    const existingSubscriber = await Subscription.findOneAndDelete({
      subscriber: _id,
    })
      .where("channel")
      .equals(channelId);
    if (!existingSubscriber) {
      return res
        .status(httpStatus.SERVER_ERROR)
        .json(httpStatus.SERVER_ERROR, {}, "Failed to find the subscriber");
    } else {
      return res
        .status(httpStatus.OK)
        .json(
          new ApiResponse(
            httpStatus.OK,
            existingSubscriber,
            "Unsubscribed successfully"
          )
        );
    }
  }

  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const channelSubscribers = await Subscription.find({channelId})

  if (Array.isArray(channelId) && channelId.length <= 0) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "channelId "));
  }
  return res
    .status(httpStatus.OK)
    .json(
      new ApiResponse(
        httpStatus.OK,
        channelSubscribers,
        "Subscribed successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const channelSubscribed = await Subscription.find({
    subscriberId,
  });
  if (Array.isArray(channelSubscribed) && channelSubscribed.length <= 0) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json(new ApiResponse(httpStatus.NOT_FOUND, {}, "channelId  not found "));
  }
  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, channelSubscribed, "Channel fetched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
