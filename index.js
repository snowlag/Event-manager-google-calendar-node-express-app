var express = require("express");
const fs = require('fs');
bodyParser     = require("body-parser");
const readline = require('readline');
const {google} = require('googleapis');
var home = require("./routes/CalendarEvents");
var app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(home);
//-----------------Render Home page-----------------------
app.get("/", function(req, res){
   res.render("home")
});
app.listen("3000", function(){
    console.log("Server started at 3000");
})