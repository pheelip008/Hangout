const express=require('express');
const router = express.Router();
const requireAuth=require("../../middleware/authMiddleware")



router.get('/home',requireAuth,(req,res)=>{
    res.json({success:true,message:`Welcome ,${req.userId}`})
})
router.get('/settings',requireAuth,(req,res)=>{
  res.json({success:true,message:`Welcome ,${req.userId}`})
})
router.get('/profile',requireAuth,(req,res)=>{
  res.json({success:true,message:`Welcome ,${req.userId}`})
})
router.get('/meeting/:roomCode',requireAuth,(req,res)=>{
  res.json({success:true,message:`Welcome ,${req.userId}`})
})
module.exports=router;