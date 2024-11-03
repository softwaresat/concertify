const session = require('express-session');
const cookieParser = require('cookie-parser');
const express = require('express')

const querystring = require("querystring"); 

const app = express()
const http = require('http').Server(app);
app.set('view engine', 'ejs');
var randomstring = require("randomstring");
const request = require('request')

var client_id = 'd27f011da8ff4ad2b6ce571b5eda7745';
const client_secret = 'e71ebe6b3a064946ac60d895056f005d';


var redirect_uri = 'http://localhost/callback';

app.use(session({
    secret: "ja;ljflkasjdf;lakjsdflkajsdfkaj",
    proxy: true,
    resave: true,
    saveUninitialized: true,
    expires: new Date(Date.now() + (30 * 86400 * 1000))
}));


app.use(express.json({
    limit: '50mb'
}));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));
app.use(express.static('views'))

app.use(cookieParser());
app.set('trust proxy', true);

 app.get('/', async function(req, res) {
   
        res.render('index.ejs');
})

app.get('/concerts', async function(req, res) {
   
    res.render('concerts.ejs');
})

app.get('/bio', async function (req, res) {
    var artist = req.query.artist || null;

    const apiKey = 'API-KEY-HERE';  // Replace this with your OpenAI API key
    const prompt = `write a short summary about ${artist}, within 100 words`;


    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,  // Adjust this as needed
                temperature: 0.7  // Adjust this as needed
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.send(data.choices[0].message.content)
    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
    }
    
})

app.get('/callback', async function(req, res) {

    var code = req.query.code || null;
    var state = req.query.state || null;
  
    if (state === null) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };
  
      // Send the request
       request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var access_token = body.access_token;
     


// Gets the concert data for one artist
async function retrieveArtistData(artistName) {
    let rawData;
    try {
        const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?size=1&apikey=apikeyhere&keyword=${artistName}`);
        const data = await response.json();

        if (data._embedded != null && data._embedded != undefined) {
            rawData = data._embedded.events;
        }
        
        return rawData;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
}   
 
let concertData = [];
async function getTopArtists(accessToken) {
    const url = 'https://api.spotify.com/v1/me/top/artists?limit=20';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        let artistNames = [];
        for(var i = 0; i < data.items.length; i++) {
            const artistData = await retrieveArtistData(encodeURIComponent(data.items[i].name));
            if(artistData != undefined){
                concertData.push(artistData);
                artistNames.push(encodeURIComponent(data.items[i].name));
            }
          
        }
        res.render('concerts',{concertData: concertData, artistNames: artistNames});

    } catch (error) {
        console.error('Error fetching top artists:', error);
    }
}

        getTopArtists(access_token);
        } else {
            res.redirect('/#' +
                querystring.stringify({
                  error: 'invalid_token'
                }));
          
        }
      });
    }
  });
  
  
// Login Authentication
app.get('/login', async function(req, res) {
    var state = randomstring.generate(16);
    var scope = 'user-read-email user-top-read user-read-private';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
});

http.listen(80, () => console.log('Server is live on port 80!'))