import { Router } from "express";
import registerUser from "../controllers/user_controller.js";
import { upload } from "../middlewares/multer_middleware.js";
const router = Router();

router.route("/register").post(
    //included upload middleware 
    upload.feilds([ 
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)


export default router;