const bcrypt = require('bcrypt');
const prisma = require('../../../prisma/prisma');

async function registerUser({ name, email, password }) {
    const existingUser = await prisma.user.findUnique({
        where: { email: email }
    });
    if (existingUser) {
        return { success:false, message: "User already exists" }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user=await prisma.user.create({
        data:{
            name,
            email,
            password:hashedPassword,
            isVerified:false, 
            provider:'email'

        }
    });
    const {password: _password,...userwop}=user;
    return {
        success:true,
        message:"User registered successfully",
        user:userwop
    };

}
module.exports={registerUser};