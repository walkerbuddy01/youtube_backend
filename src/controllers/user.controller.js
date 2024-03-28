import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import apiError from "../utils/ApiError.js";
import { uploadOnCloudinary, DeleteOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import httpStatus from "../utils/http.status.js";
import mongoose from "mongoose";

const generateAccessaAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    console.log("in access");
    return { refreshToken, accessToken };
  } catch (error) {
    throw new apiError(500, "Internal Server Error(TOKEN_GENERATION)");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;
  console.log(req.body);
  if (
    [fullname, email, password, username].some((field) => field.trim() === "")
  ) {
    throw new apiError(400, "Please fill all the fields");
  }

  if (email.includes("@")) {
    const vaildDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
    ];
    const domain = email.split("@")[1];
    //TODO: Please complete this validation
  } else {
    throw new apiError(
      400,
      "Please Enter the vaild email:Which contain the '@' symbol"
    );
  }

  //Query in the database
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new apiError(
      409,
      "User with this email and password already existed"
    );
  }

  // upload images in the cloudinary
  console.log("req.files", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath = "";
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(409, "Avatar Image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "Avatars");
  const coverImage = await uploadOnCloudinary(
    coverImageLocalPath,
    "CoverImage"
  );

  if (!avatar) {
    throw new apiError(409, "Failed to Upload avatar image");
  }

  const createdUser = await User.create({
    username,
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    refreshToken: "",
  });

  const user = await User.findById(createdUser._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new apiError(500, "Server failed to create user please try again");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  console.log(req.body);

  if (!username && !email) {
    throw new apiError(401, "Username or email is required");
  }

  const user = await User.findOne({
    // mongoose operator !
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, "User with the given credentials is not found");
  }

  if (!password) {
    throw new apiError(401, "Password is requied");
  }
  const passwordValidation = await user.isPasswordCorrect(password);

  console.log(passwordValidation);

  if (!passwordValidation) {
    throw new apiError(401, "Wrong password");
  }

  const { refreshToken, accessToken } = await generateAccessaAndRefreshToken(
    user._id
  );

  if (!refreshToken || !accessToken) {
    throw new apiError(500, "Internal server Error!");
  }

  const updatedUser = await User.findById(user._id)?.select(" -password ");

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(new ApiResponse(201, updatedUser, "user logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User loggedOut"));
});

const assignAccessToken = asyncHandler(async (req, res) => {
  const UserRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!UserRefreshToken) {
    throw new apiError(404, "No refreshToken found");
  }

  const decodedData = jwt.verify(
    UserRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedData._id);
  if (!user) {
    throw new apiError(400, "Invaild refresh token and user");
  }
  if (user.refreshToken !== UserRefreshToken) {
    throw new apiError(400, "Invaild refresh Token");
  }

  const { refreshToken, accessToken } = await generateAccessaAndRefreshToken(
    user._id
  );

  user.refreshToken = refreshToken;
  user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(200, { refreshToken }, "Token assigned successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userDetail = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, userDetail, "User is loggedIn"));
});

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new apiError(404, "Please send the required fields");
  }

  const user = await User.findById(req.user._id);

  const oldPasswordValidation = await user.isPasswordCorrect(oldPassword);

  if (!oldPasswordValidation) {
    throw new apiError(401, "password is wrong!");
  }

  user.password = newPassword;
  user.save();
  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Password changed successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const FileLocalPath = req.file?.path;
  const publicLink = req.user.avatar;

  const response = await DeleteOnCloudinary(publicLink);
  if (!response) {
    throw new apiError(401, "Updation failed");
  }
  console.log("response", response);
  console.log("publicLink", publicLink);

  if (!FileLocalPath) {
    throw new apiError(404, "Please send the file");
  }

  const avatar = await uploadOnCloudinary(FileLocalPath, "Avatars");
  if (!avatar) {
    throw new apiError(500, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    {
      new: true,
    }
  ).select(" -password -refreshToken ");

  if (!user) {
    throw new apiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, user, "Avatar changed Successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const FileLocalPath = req.file?.path;
  // const publicLink = req.user.avatar;

  // const response = await DeleteOnCloudinary(publicLink);
  // if (!response) {
  //   throw new apiError(401, "Updation failed");
  // }
  // console.log("response",response);

  if (!FileLocalPath) {
    throw new apiError(404, "Please send the file");
  }

  const coverImage = await uploadOnCloudinary(FileLocalPath, "CoverImage");
  if (!coverImage) {
    throw new apiError(500, "Failed to upload coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverImage: coverImage.url },
    },
    {
      new: true,
    }
  ).select(" -password -refreshToken ");

  if (!user) {
    throw new apiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, user, "coverImage changed Successfully"));
});

const updatefullNameOrUsername = asyncHandler(async (req, res) => {
  const { username, fullname } = req.query;

  if (!username && !fullname) {
    throw new apiError(
      httpStatus.NOT_FOUND,
      "Please send the [username || fullname]"
    );
  }

  if (username) {
    const usernameExist = await User.findOne({ username });

    if (usernameExist) {
      throw new apiError(401, "Username already Exist!");
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          username: username,
        },
      });
    }
  }
  let user;
  if (fullname) {
    user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullname,
        },
      },
      {
        new: true,
      }
    ).select(" -password -refreshToken");
  }

  return res.status(200).json(new ApiResponse(201, user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params || req.query;

  if (!username) {
    throw new apiError(httpStatus.NOT_FOUND, "username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subs",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subsTo",
      },
    },
    {
      $addFields: {
        subsCount: {
          $size: "$subs",
        },
        subsToCount: {
          $size: "$subsTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subs.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subsCount: 1,
        subsToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel) {
    throw new apiError(httpStatus.NOT_FOUND, "No user found");
  }

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, channel, "Channel detail fetched"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
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
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          },
        ],
      },
    },
    
  ]);

  if(!user){
    throw new apiError(httpStatus.NOT_FOUND,"User not found")
  }

  return res
  .status(httpStatus.OK)
  .json(new ApiResponse(httpStatus.OK,user[0].watchHistory,"WatchHistory fetched"))

});

export {
  registerUser,
  loginUser,
  logoutUser,
  assignAccessToken,
  getCurrentUser,
  updatePassword,
  updateAvatar,
  updateCoverImage,
  updatefullNameOrUsername,
  getUserChannelProfile,
  getUserWatchHistory,
};
