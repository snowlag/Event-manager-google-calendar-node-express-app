var express = require("express");
var router= express.Router();
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './token.json';
var oAuth2Client;
var dataEvents = [];
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
// Load client secrets from a local file.
function readCredentials(){
fs.readFile('./credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});
}

//Added Credential details to OAth2Client
function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
      oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris);
  }
//Load Client details
//Check if there is any previously stored token
readCredentials();
fs.readFile(TOKEN_PATH, function(err, token){
  if (err){
    console.log("User Sign Up is required to create token.") 
  }else{
    readCredentials()
    oAuth2Client.setCredentials(JSON.parse(token));
    listEvents(oAuth2Client);
  }
});

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, function(err, res){
    if (err) {
      console.log('The API returned an error: ' + err);

    } 
    else {
 dataEvents = res.data.items;
   } 
  })
}

function addEvents(auth , events){
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: events,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });
}






router.get("/code", function(req , res){
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err){
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
        res.render("code",{authUrl : authUrl});
    } else {
      res.redirect("/events")
     
     }
   
  });
  
})

router.post("/code", function(req, res){
   var code = req.body.code;

  /**
  * Get and store new token after prompting for user authorization, and then
  * execute the given callback with the authorized OAuth2 client.
  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
  * @param {getEventsCallback} callback The callback for the authorized client.
  */
    oAuth2Client.getToken(code, (err, token) => {

    if (err) return console.error('Error retrieving access token', err);
    oAuth2Client.setCredentials(token);
    listEvents(oAuth2Client);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err); console.log("--------------")
      console.log('Token stored to', TOKEN_PATH);
    });


    res.redirect("/events")
  });
})

router.get("/events", function(req , res){
fs.readFile(TOKEN_PATH, function(err, token){
    if (err){
      console.log("User Sign Up is required to create token.") 
      res.redirect("/code")
    }else{
      readCredentials()
      oAuth2Client.setCredentials(JSON.parse(token));
      listEvents(oAuth2Client);
    }
});
//Fetching data from Calendar api takes 1 to 2 seconds so intentional latency is provided to populate the data in dataEvents.
setTimeout(function(){
  res.render("events" , {events : dataEvents})
}, 2000)

})

router.get("/events/create", function(req , res){
  res.render("newEvent")
})

router.post("/events", function(req , res){
  //Create Event Object
  var event = {
    'summary': req.body.summary,
    'location': req.body.locaton,
    'description': req.body.description,
    'start': {
      'dateTime': req.body.start +":00+05:30",
      'timeZone': 'Asia/Kolkata',
    },
    'end': {
      'dateTime': req.body.end + ":00+05:30",
      'timeZone': 'Asia/Kolkata',
    },
    'recurrence': [
    ],
    'attendees': [
      {'email': req.body.email}
     ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10},
      ],
    },
  };
  fs.readFile(TOKEN_PATH, function(err, token){
    if (err){
      console.log("User Sign Up is required to create token.") 
    }else{
      readCredentials()
      oAuth2Client.setCredentials(JSON.parse(token));
      addEvents(oAuth2Client , event)
      listEvents(oAuth2Client);
      res.redirect("/events")
    }
  })
})

router.get("/events/getJSON" , function(req, res){
  fs.readFile(TOKEN_PATH, function(err, token){
    if (err){
      console.log("User Sign Up is required to create token.") 
      res.redirect("/code")
    }else{
      readCredentials()
      oAuth2Client.setCredentials(JSON.parse(token));
      listEvents(oAuth2Client);
    }
});
  fs.writeFile("./events.json", JSON.stringify(dataEvents) , function(err){
    if(err){
      console.log("Error Writing to JSON File : "+err);
    }
    else{
      console.log("Added event on event.json")
    }
  })
  setTimeout(function(){
    res.sendfile("./events.json")
  },2000)
})

module.exports = router;

/*
dateTime: "2020-04-30T19:00:00+05:30"
},
end: {
dateTime: "2020-04-30T20:30:00+05:30"
},
*/

/*

*/