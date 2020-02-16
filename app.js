const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const request = require("request");
var path = require('path');
var session = require('express-session');
const http = require('http');
const ejs = require("ejs");
var fs = require("fs");
var forceSsl = require('express-force-ssl');
app.use(forceSsl);

app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

var key = fs.readFileSync(__dirname+'/server-key.pem');
var cert = fs.readFileSync(__dirname+'/server-cert.pem' );
var options = {
  key: key,
  cert: cert,
};

var https = require('https');
https.createServer(options, app).listen(443);

http.createServer(app).listen(80);





var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'mysql',
  database : 'hackathon'
});
let posts=[];
app.get("/",function(req,res){
  res.render('index');
  var auth = req.number;
});

app.get("/admin",function(req,res){
  res.render(path.join('admin'));
});


app.post('/admin', function(req, res) {
	var username = req.body.admin_name;
	var password = req.body.admin_pass;
	if (username && password) {
		connection.query('SELECT * FROM admin WHERE user = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/cp');
			} else {
				res.send('Incorrect Username and/or Password!');
			}

		});
	} else {
		res.send('Please enter Username and Password!');

	}
});

app.get('/cp', function(req, res) {
	if (req.session.loggedin) {
		res.render('cp',{
			posts:posts
		});
	} else {
		res.send('Please login to view this page!');
	}

});

app.get('/alert', function(req, res) {
	if (req.session.loggedin) {
		res.render('alert');
	} else {
		res.send('Please login to view this page!');
	}

});

app.post('/cp',function(req,res){
  var status = req.body.status;
  if (status) {
    connection.query('SELECT * FROM cp WHERE status = ?', [status], function(error, results, fields) {
			posts=[];
      for(var i=0;i<results.length;i++){
			var post = {
        data: results[i]
      };
      posts.push(post);
}
    });
    res.redirect('/cp');
  }

  });

	app.post('/',function(req,res){
		var lat = req.body.lat;
		var long = req.body.long;

		var time = req.body.time;
		var number = req.body.number;
		var status = req.body.status;
		if (number) {
			connection.query('SELECT * FROM users WHERE mobile = ?', [number], function(error, results, fields) {
				if (results.length > 0) {
					req.session.loggedin = true;
					req.session.number = number;
					connection.query('SELECT * FROM cp WHERE mobile = ?', [number], function(err, result){
if (result.length>0){
	connection.query('update cp set lat=12.8438,longitude=80.1533,time=?,status=? where mobile=?',[time,status,number]);
}else{
					connection.query('insert into cp values(?,12.8438,80.1533,?,0)',[number,time]);

}
});
				res.redirect('/alert');
				} else {
console.log("h")
				}
			});
		} else {
			res.send('Please Mobile Number');

		}
});

app.post('/action',function(req,res){
var status = req.body.status;
req.session.loggedin = true;
var number=req.session.number;
console.log(number);
if (number) {
	connection.query('update cp set status = ? WHERE mobile = ?',[status,number])
		}
		if(status == 1){
			res.render("safe");
		}else if (status == 0) {
			res.render("unsafe");
		}
});

app.post('/safe',function(req,res){
	res.render("safe");
});

app.listen(3000,function(){
    console.log("server running...");
});
