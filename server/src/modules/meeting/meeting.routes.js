const express =require('express');
const requireAuth=require('../../middleware/authMiddleware');
const Controller=require('./meeting.controller');
const router=express.Router();

router.post("/instant",requireAuth,Controller.startInstantMeetingController);
router.post('/join',requireAuth,Controller.JoinMeetingController);
router.get("/recent",requireAuth,Controller.getRecentMeetingsController);
router.post("/schedule",requireAuth,Controller.scheduleMeetingController);
router.get('/scheduled',requireAuth,Controller.getScheduledMeetingsController);
module.exports=router;