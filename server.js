const express = require('express')
const app = express()
var bodyParser=require('body-parser');
var mysql = require('mysql');
var session=require('express-session');
// const cors = require('cors')
// app.use(cors())
const server = require('http').Server(app)
const io = require('socket.io')(server)
//const { ExpressPeerServer } = require('peer');
const { nanoid } = require('nanoid')




// const peerServer = ExpressPeerServer(server, {
//   debug: true
// });

// peer_server
var ExpressPeerServer = require('peer').ExpressPeerServer;
var peerExpress = require('express');
var peerApp = peerExpress();
var peerServer = require('http').createServer(peerApp);
var options = { debug: true }
var peerPort = 9000;
peerApp.use('/peerjs', ExpressPeerServer(peerServer, options));



const { v4: uuidV4 } = require('uuid')

var mems={};

var con = mysql.createConnection({
    
  host:"localhost",
  user:"root",
  password:"",
  database:"node_chat",
  charset : 'utf8mb4'
});


//app.use('/peerjs', peerServer);

app.use(bodyParser.urlencoded({
  extended:true                      
}));
app.use(bodyParser.json());

app.use(session({
  secret: 'secret',
  
  resave: false,
  saveUninitialized: false
}));



app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/room', (req, res) => {
  res.redirect(`room/${uuidV4()}`)
})

app.get('/test', (req, res) => {
  res.render('test');
})

app.get('/login', (req, res) => {
  res.render('login');
})

app.get('/home', function(req,res){
    
  if(!req.session.log){
    return res.redirect('/login');
  }
   res.render('home',{user:req.session.username});
});

app.get('/profile/:prof', function(req,res){
  if(!req.session.log){
    return res.redirect('/login');
  }else if(!req.params.prof){
    return res.redirect('/404');
  }else if(req.params.prof=="@me"){
    res.render('profile',{user:req.session.username,userId:req.session.uId,me:true});
  }else if(req.params.prof==req.session.uId){
    res.render('profile',{user:req.session.username,userId:req.session.uId,me:true});
  }else if(req.params.prof !== req.session.uId){
    var sql="SELECT username FROM users WHERE users.id=? LIMIT 1";
    con.query(sql,req.params.prof,function(err,result,field){
      if(err){
          console.log(err);
      }else{
        res.render('profile',{userId:req.params.prof,user:result[0].username,me:!true});
        //res.send(result);
      }
  });
  }
  //console.log(req.params.prof);
  
});

app.post('/follow',function(req,res){
  var det=req.body;
  var sql="INSERT INTO `follows`(`f1`, `f2`, `timestamp`) VALUES (?,?,?)";
  if(det.friend!==""){
    con.query(sql, [req.session.uId,det.friend,det.time], function (err, result) {
      if(err){
        res.send(err);
      }else{
        res.send({state:true});
      }
    });
  }else{
    res.send({state:false});
  }
})

app.post('/unfollow',function(req,res){
  var det=req.body;
  var sql="UPDATE `follows` SET `state`=0 WHERE f1=? AND f2=?";
  if(det.friend!==""){
    con.query(sql, [req.session.uId,det.friend], function (err, result) {
      if(err){
        res.send(err);
      }else{
        res.send({state:true});
      }
    });
  }else{
    res.send({state:false});
  }
})

app.post('/search',function(req,res){
  var det=req.body;
  var sql="SELECT `ultraId`,`roomId`, `name`, `creatorId`, `language`, `about`, `capacity`, `timestamp` FROM `voice_room` WHERE voice_room.block<>1 AND voice_room.name LIKE ? ORDER BY voice_room.id DESC LIMIT 4";
  if(det.search!==""){
    var arr={state:false}
    con.query(sql, [det.search], function (err, result) {
      if(err){
        res.send(err);
      }else{
        if (result.length > 0) {
          arr.state=true;
          arr.rooms=result;
        }
        res.send(arr);
        console.log(arr);
      }
    });
  }else{
    res.send({state:false});
  }
})

app.post('/friendship',function(req,res){
  var det=req.body;
  var sql="SELECT state FROM follows WHERE f1=? AND f2=? ORDER BY id DESC LIMIT 1";
  var arr={state:false};
  if(det.friend == req.session.uId){
    res.send(arr);
  }else{
    con.query(sql,[req.session.uId,det.friend],function(err,result,field){
      if(err){
          res.send(err);
      }else{
        if (result.length > 0) {
          if(result[0].state==1){
            arr.state=true;
          }
        }
        res.send(arr);
      }
    });
  }
})

app.post('/newroom',function(req,res){
  var det=req.body;
  var creatorId=req.session.uId;
  var arr={status:false,err:false}
  //res.send(uuidV4());
  //res.send(nanoid(10)); //=> "IRFa-VaY2b");
  var sql="INSERT INTO `voice_room`(`ultraId`, `roomId`, `name`, `creatorId`, `language`, `about`, `capacity`, `timestamp`) VALUES (?,?,?,?,?,?,?,?)";
  if(det.title!==""){
    con.query(sql, [nanoid(14),uuidV4(),det.title,creatorId,det.language,det.about,4,det.time], function (err, result) {
      if(err){
        arr.err=true;
        res.send(arr);
      }else{
        arr.status=true;
        arr.result=det;
        res.send(arr);
      }
    });
  }
})

app.post('/pop_rooms',function(req,res){
  //console.log(req.body._token);
  var sql="SELECT `ultraId`,`roomId`, `name`, `creatorId`, `language`, `about`, `capacity`, `timestamp`,users.username FROM `voice_room` INNER JOIN users ON voice_room.creatorId=users.id WHERE voice_room.block<>1 ORDER BY voice_room.id DESC LIMIT 4  ";
  con.query(sql,function(err,result,field){
    if(err){
      console.log(err);
    }else{
      res.send(result);
    }
  });
});

app.post('/newmember',(req,res)=>{
  //console.log(req.body.token);
  var det=req.body;
  var arr={state:false,space:false}
  

  var sql="SELECT voice_room.roomId,voice_room.capacity,voice_room.mem_count FROM `voice_room` WHERE ultraId=? LIMIT 1";
  con.query(sql,det.rm,function(err,result,field){
    if(err){
      console.log(err);
    }else{
      if(result[0]){
        if(result[0]['mem_count']===result[0]['capacity']){
          
        }else if(result[0]['mem_count'] < result[0]['capacity']){
          arr.state=true;
          arr.space=true;
          arr.uri=result[0]['roomId'];
        }
      }
      //console.log(result[0]['mem_count']);
      res.send(arr);
      //res.redirect(301, '/home');
    }
  });

})

app.post('/auth', function(req,res){
  var user=req.body.username;
  var pass=req.body.password;
  //console.log(user);
  var sql="SELECT id,username FROM users WHERE username=? AND password=?";
        con.query(sql,[user,pass],function(err,result,field){
            if(err){
                console.log(err);
            }else{
                if(result.length>0){
                    req.session.username=user;
                    req.session.uId=result[0].id;
                    console.log("S "+result[0].id);
                    //user_arr.push(user);
                    req.session.log=true;
                    var arr={
                        status:true,
                        user:user,
                        id:result[0].id
                    }
                    res.send(arr);
                    //console.log('FOUND');
                    //console.log(user);

                    
                }else{
                    //console.log('fail');
                    var arr={
                        status:false,
                        user:user

                    }
                    res.send(arr);
                    
                    
                }
            }
            
        });
    
});

app.get('/voice/:voice', (req,res)=>{
  if(!req.session.log){
    return res.redirect('/login');
  }else{
    var sql="SELECT `creatorId`,`name`,`about`,users.username FROM `voice_room` INNER JOIN users ON voice_room.creatorId=users.id WHERE voice_room.roomId=? ORDER BY voice_room.id DESC LIMIT 4 ";
    var admin=false;
    con.query(sql,req.params.voice,function(err,result,field){
      if(err){
          console.log(err);
      }else{
        if (result.length > 0) {
          var owner=result[0]['username'];
          req.session.roomOwner=result[0]['creatorId'];
          //console.log(owner);
          if(result[0]['creatorId']===req.session.uId) admin=true;
          res.render('boot',{user:req.session.username,userId:req.session.uId,roomId:req.params.voice,room_name:result[0]['name'],admin:admin,ownerId:result[0]['creatorId'],owner:owner});
        }else{
          res.redirect('404')
        }
      }
    })

  } 
  
});


app.get('/main', (req, res) => {
  res.render('boot');
})

app.get('/explore', (req, res) => {
  // if(!req.session.log){
  //   return res.redirect('/login');
  // }else{
    res.render('test-home');
  //}
    

})

app.get('/room/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

function getroomdetails(roomId,call){
  console.log("BEFORE CALLBACK")
  var sql="SELECT `creatorId`,users.username FROM `voice_room` INNER JOIN users ON voice_room.creatorId=users.id WHERE voice_room.roomId=? ORDER BY voice_room.id DESC LIMIT 1 ";
  con.query(sql,roomId,function(err,result,field){
    if(err){
        console.log(err);
    }else{
      if (result.length > 0) {
        var owner={
          id:result[0]['creatorId'],
          username:result[0]['username']
        }
        call(owner);
        
      }else{
        res.redirect('404')
      }
    }
  })
  
}

var participants={};
//var stage={};
//var bigData={};
io.on('connection', socket => {
/*
  console.log(socket.id);
  if (!uss[socket.id]) {
    uss[socket.id] = socket.id;
  }
  socket.emit("myID", socket.id);
  console.log(uss);
  io.emit("allUsers", uss);
*/

  socket.on('join-room', (roomId, userId,user,myId) => {
    
    socket.join(roomId)
    
    console.log('NEW JIUS'+roomId);
    
    //if (!uss[roomId][myId]) {
    //uss[roomId]= {[myId]:{id:myId,name:user}};
       //audience[roomId]= Object.assign({[myId]:{id:myId,name:user}}, audience[roomId])
       var admin=false;
       
     //}else{
      //asd[myId] = {id:myId,name:user};
     //}
     //uss[roomId]=asd;
     //uss[roomId].push(asd);
     
    //console.log(uss['4a0de58b-4498-431d-9e22-b43cc98903ee'][myId]);
    
     
    //mems.push(obj);
    //console.warn(mems);
    //socket.to(roomId).broadcast.emit('member-list',JSON.stringify(mems));
    //console.log('Big data',bigData); 
    
    //io.emit('allUsers',uss[roomId]);
    
    
    getroomdetails(roomId,call=>{
        console.log("RETURN IS ",call);
        console.log("PERSON ACRIVE",myId)
        //ask to speak
        if(call.id==myId){
          admin=true;
          participants[roomId]= Object.assign({[myId]:{id:myId,name:user,stage:true}}, participants[roomId]);
          io.in(roomId).emit("stager", {userId,user,myId});
        }else{
          participants[roomId]= Object.assign({[myId]:{id:myId,name:user,stage:false}}, participants[roomId])
        }

        
        // bigData={
        //   stage:stage[roomId],
        //   audience:audience[roomId],
        //   admin:admin
        // } 
        console.log(participants)
        io.in(roomId).emit("allUsers", {'part':participants[roomId],admin:admin});
        socket.to(roomId).broadcast.emit('user-connected', userId,user,myId);

        //mic off
        socket.on('mic-off',(state)=>{
          if(state){
            io.to(roomId).emit('mute-mic',myId)
          }else{
            io.to(roomId).emit('unmute-mic',myId)
          }
        })

        //audio level
        socket.on('user-speaking', id=>{
          io.to(roomId).emit('user-spoke-on',id)
        })
        socket.on('user-not-speaking', id=>{
          io.to(roomId).emit('user-spoke-off',id)
        })  
        
        // socket.on('raisehand',user=>{
        //   io.to(roomId).emit('reqtospeak',user)
        //   //io.sockets.in('user1@example.com').emit('new_msg', {msg: 'hello'});
        // })

        // messages
        socket.on('message', (message,time) => {
          //send message to the same room
          io.to(roomId).emit('createMessage',user, message,time)
        }); 

        //console.log(uss[roomId].admin);
        socket.on('remove',(data)=>{
          console.log('remove',call);
          if(data.admin==call.id && data.admin !==data.culprit){
            delete participants[roomId][data.culprit];
            io.to(roomId).emit('removed',data);  
            console.log("REMOVED",participants[roomId]);
          }else{
            console.log("REMOVAL INVALID"+data.culprit)
          }
        })

        socket.on('disconnect', () => {

          //delete mems["user_"+myId];
          //console.log(audience[roomId].hasOwnProperty(myId))
          delete participants[roomId][myId];
          //else delete audience[roomId];
          console.log(socket.id+' :left',participants);
          socket.to(roomId).broadcast.emit("allUsers", {'part':participants[roomId],admin:admin});
          //socket.to(roomId).broadcast.emit("allUsers", JSON.stringify(uss));
          socket.to(roomId).broadcast.emit('user-disconnected', userId,user,myId)
          
          //console.log(getKeyByValue(map,"2"));
        })

    }) 
  })
    //io.emit('allUsers',uss);
})


server.listen(process.env.PORT|| 3030)
peerServer.listen(peerPort);