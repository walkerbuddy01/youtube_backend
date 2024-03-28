import { User } from "../models/user.model.js";
import apiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
export const JWTVerify = asyncHandler(async (req, _, next) => {
  try {
    const Token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    if (!Token) {
      throw new apiError(404, "Token not found");
    }
  
    const decodedData = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedData) {
      throw new apiError(401, "unauthorized access ");
    }
  
    const user = await User.findById(decodedData._id);
    if (!user) {
      throw new apiError(401, "INVAILD_ACCESS");
    }
  
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401,error.message || "Invaild access token")
  }
});
