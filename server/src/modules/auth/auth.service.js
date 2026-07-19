const bcrypt = require('bcrypt');
const prisma = require('../../../prisma/prisma');
const jwt = require('jsonwebtoken');
async function registerUser({ name, email, password }) {
    const existingUser = await prisma.user.findUnique({
        where: { email: email }
    });
    if (existingUser) {
        return { success: false, message: "User already exists" }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            provider: 'email'

        }
    });
    const { password: _password, ...userwop } = user;
    return {
        success: true,
        message: "User registered successfully",
        user: userwop
    };

}
async function loginUser({ email, password }) {
    const userex = await prisma.user.findUnique({
        where: { email: email }
    });
    if (!userex) {
        return { success: false, message: "Invalid email or password" }

    }
    const isMatch = await bcrypt.compare(password, userex.password)
    if (!isMatch) {
        return { success: false, message: "Invalid email or password" }
    }
    const { password: _password, ...userwop } = userex;
   
    const token = jwt.sign(
        { userId: userex.id },          
        process.env.JWT_SECRET,         
        { expiresIn: process.env.JWT_EXPIRES_IN }  
    );
    
   
    return {
        success: true,
        message: "Login successful",
        user: userwop,
        token
    }

}
module.exports = { registerUser,loginUser };