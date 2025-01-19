import express from 'express'
import userController from '../controller/UserController.js'

const router = express.Router()

//public routes
router.get("/", (req, res)=>res.status(200).json({success:true}))
router.post("/register", userController.userRegisteration)
router.post("/login", userController.userLogin)

export default router