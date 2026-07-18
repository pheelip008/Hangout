const authService=require("./auth.service");

async function register(req,res){
    const {name,email,password}=req.body;
    const result = await authService.registerUser({name,email,password});
    if (!result.success) {
    return res.status(400).json(result);
    }
    return res.status(201).json(result);
}

module.exports={register};