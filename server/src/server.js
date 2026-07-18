const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const app = express()
const port = 3000



app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const authRoutes = require('./modules/auth/auth.routes');
app.use('/api/auth', authRoutes);

// app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})