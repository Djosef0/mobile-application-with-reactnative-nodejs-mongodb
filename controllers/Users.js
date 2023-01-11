import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";




export const register  = async (req , res) =>{
    try{
const {name,
       email,
       password} = req.body;
const {avatar} = req.files;
console.log(avatar)

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

export const addTask = async(req,res) =>{

    try{
   const {title , description} = req.body;
   const user = await User.findById(req.user._id);
   user.tasks.push({
    title,
    description,
    completed : false , 
    createdAt : new Date()
   })

   await user.save();

   res.status(200).json({success : true , message : "task add successfuly"})

    }catch(error){
        res
        .status(500)
        .json({success : false ,
             message : error.message})
    }
    
 }

 export const removeTask = async(req , res) =>{
   
    const {taskId} = req.params;
 

    try{

        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter((task) => task._id.toString() !== taskId.toString() )

      await user.save();

        res.status(200).json({success : true , message: "Task Removed successfuly"})


    }catch(error){
        res.status(500).json({success : false , message : error.message})
    }
 }



 export const updateTask = async(req , res) =>{
   
       try{
        
        const {taskId} = req.params;
        
        const user = await User.findById(req.user._id);

        user.task = user.tasks.find(
            (task) => task._id.toString() === taskId.toString()
             );
        user.task.completed = !user.task.completed;

        await user.save();

        res.status(200).json({success : true , message: "Task Updated successfuly"})


    }catch(error){
        res.status(500).json({success : false , message : error.message})
    }
 }


export const getMyProfile = async (req , res )=>{
 try{
    const user = await User.findById(req.user._id);

    sendToken(
        res,
        user,
        201,
        `Welcome back ${user.name}`
    )

    }catch(error){
        res.status(500).json({success: false , message : error.message});
    }
 }


export const updateProfile = async (req , res)=>{
try {

    const user = await User.findById(req.user._id);

    const {name} = req.body;

    if(name){
        user.name = name ;
    } 

    await user.save()

    res.status(200).json({success : true , message : "Profile Updated Successfuly"})


}catch(error){
res.status(500).json({success : false , message : error.message })    
}
 }


export const updatePassword = async(req , res) =>{
  
    try{

        const user = await User.findById(req.user._id).select("+password");
        const {oldPassword , newPassword} = req.body;

        if(!oldPassword || !newPassword){
            res.status(400).json({success: false , message : ""})
        }

        const isMatch = await user.comparePassword(oldPassword);




        if(!isMatch){
            return res
            .status(400)
            .json({success : false ,
                 message : "invalide Old password"});

        }

        user.password = newPassword ; 
        await user.save();

        res
        .status(200)
        .json({success : true, 
            message : "Password Updated Successfully" })

    }catch(error){
        res.status(500).json({success : false , message : error.message});
    }
 }

 export const forgetPassword = async (req , res) =>{
    try{

        const {email} = req.body;
         const user = await User.findOne({email});
         
         if(!user){
            res.status(400).json({success : false , message : "Email Invalide"})
         }

         const otp = Math.floor(Math.random() * 100000)

user.resetPasswordOtp= otp ; 
user.resetPasswordOtpExpiry = Date.now() + 10*60*1000 ;

await user.save();

await sendMail(email , 
    "Request for reseting Password", 
     `Your OTP for reset your Password ${otp}`);

res.status(200).json({success : true , message: `OTP sent to ${email}`})


    }catch(error){
        res.status(500).json({success : false , message : error.message});
    }
 }


 export const resetPassword= async (req, res)=>{
    try { 

        const {otp , newPassword} = req.body ; 

        const user = await User.findOne({resetPasswordOtp : otp ,
         resetPasswordOtpExpiry :  { $gt : Date.now()}
        }).select("+password");
   
        if(!user){
            return res.status(400).json({success : false , 
            message : "OTP invalide or has been expired"
            })
        }

        user.password=newPassword;
        user.resetPasswordOtp = null ; 
        user.resetPasswordOtpExpiry=null;
        await user.save();

        res.status(200).json({success : true ,
             message :"password changed successfuly"})
         
    } catch(error){
        res.status(500).json({success : false ,
             message : error.message})
    }
 }


