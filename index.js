require('dotenv').config();
const express = require('express');
const asyncHandler = require('express-async-handler');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const validator = require('validator');
const Url = require('./models/urlModel');

// Basic Configuration
const port = process.env.PORT || 3000;

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.CONNECTION_STRING);
    console.log(
      'Database connected:',
      connect.connection.host,
      connect.connection.name
    )
  } catch (err) {
    console.error(err.response.data.message);
  }
};

const isValidUrl = (url) => {
  return validator.isURL(url, {
    protocols: ['http', 'https', 'ftp'],
    require_tld: false,
    require_protocol: true,
    allow_query_parts: true
  });
};

connectDb();

app.use(cors()); // allow requests from all servers

app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', asyncHandler(async (req, res) => {
  const original_url = req.body.url;
  
  if ( !isValidUrl(original_url) ) {
    res.json({
      error: 'invalid url'
    });
    throw new Error('Invalid URL');
  }

  const foundUrl = await Url.findOne({ long_url: original_url });
  if ( foundUrl ) {
    res.json({
      original_url: foundUrl.long_url,
      short_url: foundUrl.short_url
    });
  } else {
    const newUrl = await Url.create({
      long_url: original_url
    });
    console.log('New URL successfully stored:', newUrl);
    res.json({
      original_url: newUrl.long_url,
      short_url: newUrl.short_url
    })
  }

}));

app.get('/api/shorturl/:shortUrl', asyncHandler(async (req, res) => {
  const shortUrl = Number(req.params.shortUrl);
  
  const foundUrl = await Url.findOne({ short_url: shortUrl });
  if ( foundUrl ) {
    const { long_url } = foundUrl;
    res.redirect(long_url);
  }
  
}));

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
