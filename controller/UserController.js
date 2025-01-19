import userModel from "../models/blogmodal.js";

class userController{
    static userRegisteration = async (req, res)=>{
        const {name, email, password, confirmpassword, tc}= req.body
        const user = await userModel.find({email})
       
       
            if(password==confirmpassword){
                try {
                    const salt = await bcrypt.genSalt(10)
                    const hashPassword = await bcrypt.hash(password, salt)
                    const doc = new userModel({
                        name,email,password:hashPassword,tc
                    })
                    const r = await doc.save();
                    //generate jwt token
                    const user = await userModel.findOne({email:email})
                    const token=jwt.sign({userId:user._id}, process.env.JWT_SECRET_KEY, {expiresIn:'5d'})

                    //for cookie
                    // req.session.user = user              
                    //connect.sid named cookie in frontend

                    res.status(201).json({success: true ,user,token, message: "Registered Successfully"})
                    
                } catch (error) {
                    res.status(400).json({success: false ,message:"User already exists"})
                }
            } else {
                res.status(401).json({success: false ,message:"Password didn't match"})
            }

            
    }
        // save in localstorage and send everytime you need to access protected routes
        // const token = localStorage.getItem('token');
        // const headers = {
        // Authorization: `Bearer ${token}`,
        // };
        // await axios.get("/route", {headers})

        // logout
        // localStorage.removeItem('token');

    static userLogin=async (req, res)=>{
        try {
            const {email, password}=req.body
            const result = await userModel.findOne({email})
            const isMatch = await bcrypt.compare(password, result.password) 

            //cookie
            // req.session.user = result
            // include in if statement

            if(isMatch){
                // const user = await userModel.findOne({email:email})
                const token=jwt.sign({userId:result._id}, process.env.JWT_SECRET_KEY, {expiresIn:'5d'})
                res.status(200).json({result, token, success: true, message:"Logged in Successfully"})
            }else{
                res.status(401).json({success: false ,message:"Password didn't match"})
            }
            // res.send("wrong")
        } catch (error) {
            res.status(401).json({success: false ,message:"User not exists"})
        }
    }
    
}

export default userController