import { Router } from "express";
import { registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken, 
     changePassword, 
     getCurrentUser, 
     updateAccountDetails, 
     updateAvatar, 
     updateCoverImage, 
     getUserChannnelProfile, 
     getWatchHistory 
    } from "../controllers/user_controller.js";
import { upload } from "../middlewares/multer_middleware.js";
import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

router.route("/register").post(
    //included upload middleware 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

// login route
router.route("/login").post(loginUser)

// secured route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token", refreshAccessToken)

router.route("/change-password").post(verifyJWT, changePassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

router.route("coverimage").patch(verifyJWT, upload.single("cover"), updateCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannnelProfile)

router.route("/watch-history").get(verifyJWT, getWatchHistory)
export default router;