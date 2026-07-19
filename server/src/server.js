const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const app = express();
const port = 3000
const cookieParser=require('cookie-parser');
const passport=require('./config/passport');
const jwt=require('jsonwebtoken');

app.use(passport.initialize());
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/auth/google',passport.authenticate('google',{
  scope:['profile','email']
}));
app.get('/auth/google/callback',
  passport.authenticate('google',{
    session:false
  }),
  (req,res)=>{
    const token=jwt.sign(
      {userId:req.user.id},
      process.env.JWT_SECRET,
      {
        expiresIn:process.env.JWT_EXPIRES_IN
      }
    );
    res.cookie('token',token,{httpOnly:true})
    res.redirect('http://localhost:5173/home');
  }
)

const authRoutes = require('./modules/auth/auth.routes');
app.use('/api/auth', authRoutes);
const userRoutes=require('./modules/user/user.routes');
app.use('/',userRoutes)

// app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send('Hello World')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})