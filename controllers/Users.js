import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";



export const register  = async (req , res) =>{
    try{
const {name,
       email,
       password} = req.body;
const {avatar} = req.files;

let user  = await User.findOne({email});
if(user){
    return res
    .status(200)
    .json({
        success : false ,
        message : "User already Exists"});
}

const otp = Math.floor(Math.random() * 100000)

user = await User.create({name ,
     email ,
     password ,
     avatar ,
     otp , 
     otp_expiry : new Date(Date.now() + process.env.OTP_EXPIRE*60 * 1000) 
    });

await sendMail(email , 
    "Verify your account", 
     `Your OTP ${otp}`);


 sendToken(
    res ,
    user ,
    200 ,
    "OTP sent to your email , Please verify your Account")
    
}catch(error){
        res.status(500).json({
            success : false ,
            message : error.message});
    }
}