var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var diaryRouter = require('./routes/diary');
var recordRouter = require('./routes/record');

var session = require('express-session');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret:"test",
  name:"appTest",
  cookie:{maxAge:60*60*1000},
  resave:false,
  saveUninitialized:true
}))


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/diary',diaryRouter);
app.use('/record',recordRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var loginname="";

//socket server
var ws = require("ws");
var websocketServer = ws.Server;
var clientuser = {};
var info = "员工_";
var count = 0;
var port = 8800;

var wss = new websocketServer({port});

console.log("服务端socket启动，端口:8800");

wss.on("connection",(ws)=>{
    count++;
    ws.name = info+count;
    clientuser[ws.name] = ws;

    ws.on("message",function(msg){
        broadcast(msg,ws);
    })

    ws.on("close",()=>{
      console.log(`${ws.name}下线了..`);
      delete clientuser[ws.name];
      broadcast("下线了，再见");
    })
})

function broadcast(msg,ws){
  for(var key in clientuser)
  {
    clientuser[key].send(`${ws.name}:${msg} <br>`);
  }
}

module.exports = app;
