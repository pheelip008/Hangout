const authService=require("./auth.service");

async function logout(req,res){
    res.clearCookie('token');
    res.json({success:true,message:"log out successful"})
}
async function me(req,res){
    res.json({success:true,userId:req.userId});
}
async function register(req,res){
    const {name,email,password}=req.body;
    const result = await authService.registerUser({name,email,password});
    if (!result.success) {
    return res.status(400).json(result);
    }

    return res.status(201).json(result);
}
async function login(req,res){
    const {email,password}=req.body;
    const result=await authService.loginUser({email,password});
    if(!result.success){
        return res.status(401).json(result);
    }
    res.cookie('token', result.token, { httpOnly: true });
    return res.status(200).json(result);
}

module.exports={register,login,me,logout};