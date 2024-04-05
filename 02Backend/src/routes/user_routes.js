import { Router } from "express";
import {registerUser,loginUser,logoutUser,refreshAccessToken} from "../controllers/user_controller.js";
import { upload } from "../middlewares/multer_middleware.js";
import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

router.route("/register").post(
    //included upload middleware 
    upload.fields([ 
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

// login route
router.route("/login").post(loginUser)

// secured route
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token",refreshAccessToken)

export default router;