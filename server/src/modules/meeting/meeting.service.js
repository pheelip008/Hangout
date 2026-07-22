const prisma = require("../../../prisma/prisma");
const crypto = require("crypto");
function generateSegment(length){
    const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result="";
    for(let i=0;i<length;i++){
        const randomIndex=crypto.randomInt(0,chars.length);
        result+=chars[randomIndex];
    }
    return result;
}
async function generateUniqueRoomCode() {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = generateRoomCode();
    const existing = await prisma.meeting.findUnique({ where: { roomCode } });
    exists = !!existing;
  }

  return roomCode;
}


function generateRoomCode() {
  return `HGT-${generateSegment(3)}-${generateSegment(4)}`;
}

async function startInstantMeeting(userID,titlex) {
    const user = await prisma.user.findUnique({
        where: { id: userID }
    });
    
    const roomCode=await generateUniqueRoomCode();
    const meeting = await prisma.meeting.create({
        data: {
            roomCode,
            userID: user.id,
            title: titlex,
            status: "ongoing",
            startedAt: new Date(),
        }
    });
    return {success:true,meeting}
    
    
}

async function joinMeeting(userID,roomCode){
    const meeting=await prisma.meeting.findUnique({
        where:{roomCode:roomCode}
    })
    if(!meeting){
        return {success:false,message:"invalid code"}
    }
    const userx=await prisma.participant.findFirst({
        where:{userId:userID,meetingID:meeting.id}
    });
    if(!userx){
        const participant=await prisma.participant.create({
            data:{
                userId:userID,
                meetingID:meeting.id
            }
        });
        return{success:true,meeting};
    }else{
        return{success:false,message:"user already joined"}
    }

    
}

async function getRecentMeetings(userId){
    const meetings= await prisma.meeting.findMany({
        where:{userID:userId},
        orderBy:{createdAt:'desc'},
        take:3
    });
    return {success:true,meetings}

}
async function getScheduledMeetings(userId){
    const meetings= await prisma.meeting.findMany({
        where:{userID:userId},
        orderBy:{scheduledAt:'asc'},
        take:3
    });
    return {success:true,meetings}

}
async function scheduleMeeting(userId,title,scheduledAt){
    const user =await prisma.user.findUnique({
        where:{id:userId}
    });
    const roomCode=await generateUniqueRoomCode();
    const meeting = await prisma.meeting.create({
        data: {
            roomCode,
            userID: user.id,
            title: title,
            status: "scheduled",
            scheduledAt: scheduledAt,
        }
    });
    return {success:true,meeting}

}

module.exports ={startInstantMeeting,joinMeeting,getRecentMeetings,getScheduledMeetings,scheduleMeeting}