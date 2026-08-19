require('dotenv').config();
const express = require('express');
const { CLIENT_ORIGIN } = require('./config/network');
const initSocket=require('./config/socket');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();
const port = process.env.PORT || 3000
const cookieParser=require('cookie-parser');
const passport=require('./config/passport');
const jwt=require('jsonwebtoken');
const http = require('http');
const cors = require('cors');


app.use(passport.initialize());
app.use(cookieParser());

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
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
    res.cookie('token',token,{
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.redirect(`${CLIENT_ORIGIN}/home`)
  }
)

const authRoutes = require('./modules/auth/auth.routes');
app.use('/api/auth', authRoutes);
const userRoutes=require('./modules/user/user.routes');
app.use('/',userRoutes)
const meetingRoutes = require('./modules/meeting/meeting.routes');
app.use('/api/meetings', meetingRoutes);
// app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send('Hello World')
})

// app.get('/api/turn-credentials', async (req, res) => {
//   try {
//     const response = await fetch(`https://${process.env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);
//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch TURN credentials' });
//   }
// });
app.get('/api/turn-credentials', async (req, res) => {
  try {
    const response = await fetch(`https://${process.env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Failed to fetch TURN credentials:", error);
    res.status(500).json({ error: 'Failed to fetch TURN credentials' });
  }
});

const server = http.createServer(app);   // wrap Express app in a raw HTTP server
const io=initSocket(server);
server.listen(port, () => {
   console.log(`App listening on port ${port}`)
});
