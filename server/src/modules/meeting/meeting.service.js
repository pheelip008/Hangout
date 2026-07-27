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
    await prisma.participant.create({
            data:{
                userId:userID,
                meetingID:meeting.id
            }
        });
    return {success:true,meeting}
    
    
}

async function joinMeeting(userID,roomCode){
    let meeting=await prisma.meeting.findUnique({
        where:{roomCode:roomCode}
    })
    if(!meeting){
        return {success:false,message:"invalid code"}
    }
    console.log("Meeting found, current status:", meeting.status);
    if (meeting.status === "scheduled") {
    meeting =await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
            status: "ongoing",
            startedAt: new Date()
        }
    });
    console.log("Update result:", meeting.status, meeting.startedAt);
    }
    const userx=await prisma.participant.findFirst({
        where:{userId:userID,meetingID:meeting.id}
    });
    if(!userx){
        await prisma.participant.create({
            data:{
                userId:userID,
                meetingID:meeting.id
            }
        });
        return{success:true,meeting};
    }else{
        return{success:true,meeting}
    }

    
}

async function getRecentMeetings(userId){
    const meetings= await prisma.meeting.findMany({
        where:{userID:userId,status: "ongoing"},
        orderBy:{startedAt:'desc'},
        take:3
    });
    return {success:true,meetings}

}
async function getScheduledMeetings(userId){
    const meetings= await prisma.meeting.findMany({
        where:{userID:userId,status: "scheduled"},
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
    await prisma.participant.create({
            data:{
                userId:userId,
                meetingID:meeting.id
            }
        });
    return {success:true,meeting}

}

module.exports ={startInstantMeeting,joinMeeting,getRecentMeetings,getScheduledMeetings,scheduleMeeting}