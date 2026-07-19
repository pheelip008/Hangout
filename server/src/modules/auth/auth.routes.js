const express=require('express');
const router = express.Router();
const validation=require("./auth.validation")
const controller = require("./auth.controller");


router.post('/register',validation.ValidateRegister,controller.register);
router.post('/login',validation.ValidateLogin,controller.login);
module.exports=router;