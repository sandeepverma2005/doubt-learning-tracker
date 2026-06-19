import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
 const generateAccessAndRefereshTokens = async(userId)=>{
     try{
        const user= await User.findById(userId)
        const accessToken=   user.generateAccessToken()
        const refreshToken=   user.generateRefreshToken()

        user.refreshToken = refreshToken
       await  user.save({validateBeforeSave: false})

       return {accessToken,refreshToken}


       
     }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
     }
 }
const registerUser = asyncHandler(async (req, res) => {
      
    const { fullName, email, username, password } = req.body;
     
    // 2. Validation: Check if fields are empty
    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    console.log("REQ.BODY:", req.body);
console.log("REQ.FILES:", req.files);

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // 4. Handle file uploads (Avatar is required)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
   
   

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
   

    const avatar = await uploadOnCloudinary(avatarLocalPath);
  

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // 5. Create user object in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        password,
        username: username.toLowerCase()
    });

    // 6. Remove sensitive fields from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 7. Send response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
});

const loginUser = asyncHandler(async (req,res)=>{
     

      
      const {email,username,password}= req.body

     

       if(!username && ! email){
        throw new ApiError(400,"username and password are required")
      }
        

    const user= await  User.findOne({
        $or: [{username},{email}]
      })

      if(!user){
        throw new ApiError(404,"User does not exist")
      }


   const isPasswordValid=  await user.isPasswordCorrect (password) //password--> hamara wala password jo body se liya,,user -->jo abhi hamne databse se liya hai
    if(!isPasswordValid){
        throw new ApiError(401,"Invalied user credentials")
      }

   const {accessToken,refreshToken}= await  generateAccessAndRefereshTokens(user._id)
         
   const loggedInUser= await User.findById(user._id).
   select("-password -refreshToken")

   const options= {
     httpOnly :true,
     secure:true     
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)     // browser me access token naam ki cookie save kar do
   .cookie("refreshToken",refreshToken,options)
   .json(   // final JSON response bhejo
    new ApiResponse(  
        200,
        {
            user: loggedInUser,accessToken,refreshToken
        },
        "User logged In Successfully"
    )
   )





})

const logoutUser = asyncHandler(async(req,res)=>{
  
  await  User.findByIdAndUpdate(

    
    req.user._id,
    {
        $unset: {
            refreshToken: 1 //. Database se refreshToken hata diya
        }
    },{
        new :true
    }
   )


    const options= {
     httpOnly :true,
     secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged Out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    //cookie se lekar refresh kar sakate hain
    const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken
    if(!incomingRefreshToken){
         throw new ApiError(401,"unauthorized request")
    }
try{
 const decodedToken=   jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
  const user= await   User.findById(decodedToken?._id)
      if(!user){
         throw new ApiError(401,"Invalied refresh token")
    }

     console.log("Incoming Token:", incomingRefreshToken);

console.log("DB Token:", user.refreshToken);

console.log(
    "Match:",
    incomingRefreshToken === user.refreshToken
);

    if(incomingRefreshToken!==user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
    }

  const options= {
    httpOnly:true,
    secure:true,
    path: "/"
    
  }
 //


    const {accessToken,newRefreshToken}=await  generateAccessAndRefereshTokens(user._id)

return res
.status(200)
.cookie("accessToken",accessToken)
.cookie("refreshToken",newRefreshToken)
.json(
    new ApiResponse(
        200,
        {
            accessToken,refreshToken: newRefreshToken
        },
        "Acccess token refreshed"
    )
)}
catch(error){
    throw new ApiError(401,error?.message||"Invalid refresh token")
}



})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}= req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
         throw new ApiError(404,"Invalid old password")
    }

    user.password= newPassword //sirf Ram me value badla hai abhi databse me nhi
    await user.save({validateBeforeSave:false}) //user.save(),,Ram->mongoDB
    return res
        .status(200)
        .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails= asyncHandler(async(req,res)=>{
    const {fullName,email}= req.body
    
    console.log(req.body)
    if(!fullName||!email){
        throw new ApiError(400,"All fields are required |||")
    }
// database me user ko find karo aur update bhi karo
 const user= await  User.findByIdAndUpdate(
        req.user?._id,
        {

        // in fields ki value change (set) karo
            $set:{
                    // fullName ko naye fullName se update karo
                fullName,
                  // email ko naye email se update karo
                email: email
            }
        },
           // updated document return karo
    // purana document nahi
        {new:true}

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(req,res)=>{
     const avatarLocalPath=   req.file?.path
     if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
     }
          //todo : delelete old image -assignment
        
     // 1. pehle user ko DB se lao
const existingUser = await User.findById(req.user?._id)
  if (!existingUser) {
        throw new ApiError(404, "User not found");
    }

// old avatar URL
const oldAvatarUrl = existingUser.avatar

// URL se public_id nikalne ki koshish
    if (oldAvatarUrl) {

        const parts = oldAvatarUrl.split("/");

        const lastPart = parts[parts.length - 1];

        const oldAvatarPublicId = lastPart.split(".")[0];

        if (oldAvatarPublicId) {
            await cloudinary.uploader.destroy(oldAvatarPublicId);
        }
    }
    
   ////
     const avatar= await uploadOnCloudinary(avatarLocalPath)

     if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
     }

   const user=   await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },{
            new:true
        }
     ).select("-password")

     return res
     .status(200)
     .json(
        new ApiResponse(200,user,"Avatar imageupdated successfully")
     )
})



//forgot password ka bhi feature add kar denge taki thik rahe
export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
   
    
     };