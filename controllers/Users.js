import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";




export const register  = async (req , res) =>{
    try{
const {name,
       email,
       password} = req.body;
// const {avatar} = req.files;

let user  = await User.findOne({email});
if(user){
    return res
    .status(400)
    .json({
        success : false ,
        message : "User already Exists"});
}


const otp = Math.floor(Math.random() * 100000)

user = await User.create({name ,
     email ,
     password ,
     avatar :{
       public_id : "",
       url: "",
     },
     otp , 
     otp_expiry : new Date(Date.now() + process.env.OTP_EXPIRE*60 * 1000) 
    });

await sendMail(email , 
    "Verify your account", 
     `Your OTP ${otp}`);


 sendToken(
    res ,
    user ,
    201 ,
    "OTP sent to your email , Please verify your Account")
    
}catch(error){
        res.status(500).json({
            success : false ,
            message : error.message});
    }
}

export const verify = async (req , res)=>{
    try{
   const otp = Number(req.body.otp);

   const user = await User.findById(req.user._id);

   if(user.otp != otp || user.otp_expiry < Date.now()){
   return res.status(400).json({success : false , message  : "Invalide OTP Or has been expired"})
   }
   
   user.verified = true;
   user.otp = null ;
   user.otp_expiry = null;

   await user.save();
   sendToken(res , user , 200 , "Account verified");

    }catch(error){
    res.status(500).json({success : false , message : error.message})
    }
}


export const login  = async (req , res) =>{
    try{
const { email,password} = req.body;

if(!email ||!password){
    return res.status(400).json({success : false ,
    message : "Please enter all fildes"
    })
}

const user  = await User.findOne({email}).select("+password");
console.log(user)
if(!user){
    return res.status(400)
    .json({success : false ,message : "Invalide password  or email"});
}


const isMatch = await user.comparePassword(password);

if(!isMatch){
    return res.status(400).json({success : false , message : "Invalide Email Or password !"})
}

 sendToken(res ,user ,200 ,"Login Successfuly");
    
}catch(error){
        res.status(500).json({
            success : false ,
            message : error.message});
    }
}


export const logout = async(req,res) =>{

try{
res.status(200).cookie(
    "token",null,{
    expires : new Date(Date.now())})
    .json({success : true ,
         message : "Logged out successfuly"})
}catch(error){
    res
    .status(500)
    .json({success : false ,
         message : error.message})
}

}