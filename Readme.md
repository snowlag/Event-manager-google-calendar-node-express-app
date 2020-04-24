# Event-manager-google-calendar-node-express-app
## This Node App allows user to sign in with Google Account and see their upcoming events, give Json format of the events and to add new event in their Calendar
### First Install all the Dependencies
```
 "dependencies": {
    "body-parser": "^1.19.0",
    "ejs": "^3.0.2",
    "express": "^4.17.1",
    "googleapis": "^39.2.0",
    "request": "^2.88.2"
  },
```
- Install NodeJs and npm from [here] (https://www.npmjs.com/get-npm)
- Type the following Commands in terminal
```
    npm install body-parser
    npm install ejs
    npm install express
    npm install googleapis
    npm install request
```
### Get Client Credential File
- You can quickly get credential file from [here](https://developers.google.com/calendar/quickstart/nodejs).
- You can do these manually by making a new project [on google console api](https://console.developers.google.com/) 
    - After creating project enable google Calendar api
    - Create Credentials by setting authorised redirect url to https://developers.google.com/oauthplayground
    - Copy Client id , Client Secret and redirect url.
- After getting Client Credentials, make a credential.json file having he client id, client secret and redirect url.
```
    {"installed":
        {
            "client_id":"",
            "project_id":"","auth_uri":"https://accounts.google.com/o/oauth2/auth",
            "token_uri":"https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
            "client_secret":"",
            "redirect_uris":"https://developers.google.com/oauthplayground"
            
        }
    }
```
## Understanding the File structure
- index.js is the entry point of the Application
- routes file contains the js file having all the Routes defined.
      - Including it in index.js
        ```
        var home = require("./routes/CalendarEvents");
        app.use(home);

        ```
    

- public Directory contains the css stylesheets
     - Including it in index.js.
        ```
        app.use(express.static("public"));
        ```

- View folder contains the ejs files.
     - Including it in index.js. This sets view folder for ejs files.
        ```
        app.set("view engine", "ejs");

       ```
## Important functions
- Body parser allows you to extract body from the requests
        ```
         app.use(bodyParser.urlencoded({extended : true}));
        ```
- Start the server on local host
    ```
    app.listen("3000", function(){
    console.log("Server started at 3000");
    })
    ```
- To read credential file , token file we make use of [fs](https://www.npmjs.com/package/fs)
    ```
        fs.readFile('./credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), listEvents);
        });
        }
    ```
        fs.readFile(TOKEN_PATH, function(err, token){
        if (err){
            console.log("User Sign Up is required to create token.") 
        }else{
            readCredentials()
            oAuth2Client.setCredentials(JSON.parse(token));
            listEvents(oAuth2Client);
        }
        });
    
    ```
## Function for Google Calendar Api
- We define the scope. Scope lets you decide how you are going to use api. Our aim is to read and write in users Calendar api. 
```
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

```
- We read the Credentials of the the credential.json and then we pass it to authorise function which initializes google Oath2client.
    ```
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

    ```
- Generating authorisation url to get authorisation code.
    ```
     const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

    ```
- Getting token.
  -  We get token when user allow our application to access users calendar. Since we are doing these on local host,User has copy the authorisation code paste it into our form. This is because google do not allow to set redirect url to local host.
  - These function exchanges authorisation code for token and stores it in token.json file so that user will not have to sign up again and again.
  ```
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        listEvents(oAuth2Client);
    // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err); console.log("--------------")
            console.log('Token stored to', TOKEN_PATH);
         });
    });

  ```
  - Reading upcoming 10 events from calendar. These function returns the object containing nearest 10 events in users calendar
    ```
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
    ```
- To add event we have the user form from which by post request we extract the information. we then create an event object containing that    information.
    ```
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

    ```
Add these Event in user's Calendar
```
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
```
- In oder to provide user with JSON Format of the file we we take the event object and use ```JSON.stringify(object) ``` function to convert javascript object to JSON format.
```
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
```
### These above Functions will be called in RESTful routes 
- -/ => Home page ( GET )
- -/code => Authorisation Code page form ( GET )
- -/code => Validating auth Code and getting token (POST)
- -/events => View event page (GET)
- -/events/create => Create new event page (GET)
- -/events => Adding Event to Calendar (POST)
- Note
 - User cannot use same token for more than 1 hour. Delete token file if the api return with error and sign up again.
 - Any errors like giving wrong time range of event, api errors are handeled in console so it will not be visible on page.

- [Home page](/Pictures/homepage.png)
- [Authorisation Code Form](/pictures/AuthCodeForm.png)
- [Events Page](/pictures/events.png)
- [JSON Format](/pictures/json.png)
- [Google Sign Up page](/pictures/signup)
- [Creating Event](/pictures/createevent.png)
    
   


