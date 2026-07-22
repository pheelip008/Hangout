const meetingService=require("./meeting.service");
async function startInstantMeetingController(req,res){

    const user=req.userId;
    const {title}=req.body;
    const result =await meetingService.startInstantMeeting(user,title);
    return res.status(201).json(result);


}

async function JoinMeetingController(req,res){
    const user=req.userId;
    const {roomCode}=req.body;
    const result=await meetingService.joinMeeting(user,roomCode);
    if (!result.success) {
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
}

async function getRecentMeetingsController(req,res){
    const user=req.userId;
    const result= await meetingService.getRecentMeetings(user);
    if(!result.success){
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
}
async function getScheduledMeetingsController(req,res){
    const user=req.userId;
    const result= await meetingService.getScheduledMeetings(user);
    if(!result.success){
        return res.status(400).json(result);
    }
    return res.status(200).json(result);
}

async function scheduleMeetingController(req,res){
    const user=req.userId;
    const {title,scheduledAt}=req.body;
      const scheduledAtDate=new Date(scheduledAt);
      const result=await meetingService.scheduleMeeting(user,title,scheduledAtDate);
      if(!result.success){
        return res.status(400).json(result);
      }
      return res.status(201).json(result);


}
module.exports={startInstantMeetingController,JoinMeetingController,getRecentMeetingsController,getScheduledMeetingsController,scheduleMeetingController}