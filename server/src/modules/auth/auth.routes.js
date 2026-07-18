const express=require('express');
const router = express.Router();
const validation=require("./auth.validation")
const controller = require("./auth.controller");

router.post('/register',validation,controller.register);
module.exports=router;