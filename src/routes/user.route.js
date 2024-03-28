import express from "express";
import {
  assignAccessToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateAvatar,
  updateCoverImage,
  updatePassword,
  updatefullNameOrUsername,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { JWTVerify } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },  
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(JWTVerify, logoutUser);
router.route("/assignToken").post(assignAccessToken);
router.route("/getCurrentUser").get(JWTVerify, getCurrentUser);
router.route("/change-password").post(JWTVerify,updatePassword)
router.route("/change-Fn-Un").patch(JWTVerify,updatefullNameOrUsername)
router
  .route("/change-avatar")
  .patch(JWTVerify, upload.single("avatar"), updateAvatar);
router
  .route("/change-coverImage")
  .patch(JWTVerify, upload.single("coverImage"), updateCoverImage);

export default router;
