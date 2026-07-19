function ValidateRegister(req,res,next){
        
        const {name,email,password}=req.body;
        console.log("Body received:", req.body);
        if(!name||!password||!email){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        }
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({
                success:false,
                message:"Invalid email format"

            });
        }
        if(password.length<8){
            return res.status(400).json({
                success:false,
                message:"Password must be at least 8 characters"
            });
        }
        next();

}
function ValidateLogin(req,res,next){
    const {email,password}=req.body;
        console.log("Body received:", req.body);
        if(!password||!email){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        }
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({
                success:false,
                message:"Invalid email"

            });
        }
        next()
}
module.exports={ValidateLogin,ValidateRegister}