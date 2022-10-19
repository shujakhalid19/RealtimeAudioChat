const socket = io('/')
var audit=document.getElementById('audits');
var instantMeter=document.getElementById('instantMeter');
var slowMeter=document.getElementById('slowMeter');

const videoGrid = document.getElementById('video-grid')
const lstnrGrid=document.getElementById('listeners');
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '9000'
})
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
const mems = {}
const stream={};
// navigator.mediaDevices.getUserMedia({
//   video: true,
//   audio: true
// }).then(stream => {
//   myVideoStream = stream;
//   addVideoStream(myVideo, stream)
//   myPeer.on('call', call => {
//     call.answer(stream)
//     const video = document.createElement('video')
//     call.on('stream', userVideoStream => {
//       addVideoStream(video, userVideoStream)
//     })
//   })

//   socket.on('user-connected', userId => {
//     connectToNewUser(userId, stream)
//   })
//   // input value
//   let text = $("input");
//   // when press enter send message
//   $('html').keydown(function (e) {
//     if (e.which == 13 && text.val().length !== 0) {
//       socket.emit('message', text.val());
//       text.val('')
//     }
//   });
//   socket.on("createMessage", message => {
//     $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
//     scrollToBottom()
//   })
// })

function speak(){
navigator.mediaDevices.getUserMedia({
  video: !true,
  audio: true
}).then(stream => {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioContext = new AudioContext();

  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  var options = {};
  var speechEvents = hark(stream, options);

  speechEvents.on('speaking', function() {
    socket.emit('user-speaking',USER_ID);
  });

  speechEvents.on('stopped_speaking', function() {
    socket.emit('user-not-speaking',USER_ID);
  });
  
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    
    call.on('stream', userVideoStream => {
      console.warn('CALL')
      addVideoStream(video,window.cl, userVideoStream);
    })
  })
  
  //handleSuccess(myVideoStream,USER_ID);
  
})
}

peer.on('call', function(call) {
  call.answer(stream); // Answer the call with an A/V stream.
    call.on('stream', function(remoteStream) {
      // Show stream in some video/canvas element.
    });
  });
  

socket.on('user-connected', (userId,user,myUid) => {
  setAud(user,'joined the chat','text-muted');
  
  //handleSuccess(stream,myUid);
})

  // input value
  let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    var d=new Date();
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', {text:text.val(),time:d.getTime()});
      text.val('');
    }
  });
  socket.on("createMessage", (user,message) => {
    console.log(message);
    var rtime=moment(new Date(message.time)).format('LT'); ;
    $(".message").append('<div class="md-btm-10"><span class="f-15 user b text-primary">'+user+'</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-muted pull-right f-12 ">'+rtime+'</span><div class="pd-lt-10 f-12" style="word-wrap:break-word;">'+message.text+'</div></div>');
    scrollToBottom()
  })
  //socket.on('user-connected', (userId,user,myUid) => {
    //setAud(user,'joined the chat','text-muted');
    //connectToNewUser(userId,user,myUid, stream)
    //handleSuccess(stream,myUid);
  //})


socket.on('allUsers',arr=>{
  console.warn('asdasd',arr);
  //console.warn(JSON.parse(arr));
  // for (var key of Object.keys(arr)) {
  //   console.log(key + " -> " + arr[key])
  // }
  $.each(arr.part, function(k,u){
    var elem=document.getElementById("avatar_"+u['id']);
    if(!elem){
      if(u['stage']){
        setSpeakerAvatar(u['name'],u['id']);
        speak()
      }else{
        setAvatar(u['name'],u['id']);
      }
    }
      
  })

  $.each(arr.stage, function(k,u){
    console.warn('aa',u);
    var elem=document.getElementById("avatar_"+u['id']);
    if(u['id']!==USER_ID){
      //glob vari for remote user to check if avatar is added
      window.cl=u['id'];
    }else if(u['id']==USER_ID){
      setToSpeak();
    }
    if(!elem){
        setSpeakerAvatar(u['name'],u['id']);
    }
  })


  
})


//micoff
socket.on('mute-mic',user=>{
  console.log(user+' muted mic');
  var s=document.getElementById('badge_'+user).childNodes[0];
  //let classesToAdd = [ 'fas','fa-microphone-slash'];
  $(s).toggleClass('fa-microphone fa-microphone-slash')
  
})

//micon
socket.on('unmute-mic',user=>{
  console.log(user+' unmute-mic');
  var s=document.getElementById('badge_'+user).childNodes[0];
  
  //get video tag and detect audio
  
  //let classesToAdd = [ 'fas','fa-microphone'];
  $(s).toggleClass('fa-microphone-slash fa-microphone');
})
//io.to(roomId).emit('user-spoke-on',id)

//socket.on('reqtospeak',user=>{setAud(user,'wants to speak','text-primary b')});

//remote user spoke
socket.on('user-spoke-on',user=>{
  setSpeaking(user,true);
})

socket.on('user-spoke-off',user=>{
  setSpeaking(user,!true);
})


socket.on('removed',(data)=>{
  console.log('kiked',data)
  if(data.culprit==USER_ID){
    myPeer.destroy();
    document.write="You've been removed from this group";
  }
  removeAvatar(data.culprit);
});

socket.on('user-disconnected', (userId,user,myId) => {
  if (peers[userId]) peers[userId].close()
  setAud(user,'left the chat','text-muted');
  removeAvatar(myId);
  $("#elem_"+myId).remove();
})




myPeer.on('open', id => {
  console.warn("IPEN")
  socket.emit('join-room', ROOM_ID, id,USER,USER_ID);

})

function setSpeaking(user,type){

  var img = document.getElementById('img_'+user);
  (type)? $(img).addClass('speaking') : $(img).removeClass('speaking') ;
  
  return false;
}

function kick_user(fid){
  console.warn('admin'+USER_ID+' kicked '+fid);
  if(USER_ID==fid){
    //return false;
    socket.emit('remove',{admin:USER_ID,culprit:fid})
  }else{
    socket.emit('remove',{admin:USER_ID,culprit:fid})
  }
}

function connectToNewUser(userId,user,myUid, stream) {
  console.warn('myUid'+myUid)
  const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video,myUid, userVideoStream)
    })
  
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function setAud(user,word,type){
    //audit.innerHTML='<div class="text-muted f-12">'+user+' just '+word+'</div>';
    $(".message").append('<div class="f-12 '+type+' text-center md-top-10 md-btm-10">'+user+' '+word+' </div>');
}

function setSpeakerAvatar(user,myUid){
  var div=document.createElement('div');
  var div2=document.createElement('div');
  var span_mic=document.createElement('span');

  var img=document.createElement('img');
  var h5=document.createElement('h5');


  let classesToAdd = [ 'text-center','col-xs-3','col-sm-3','col-md-2'];
  div.classList.add(...classesToAdd);
  //data-toggle="modal" data-target="#myModalTest"
  div.setAttribute('id','avatar_'+myUid);
  div.onclick=function(){ user_prof(myUid,user) }; 


  div2.classList.add('notif');
  if(ADMIN_ID===myUid){
    ac='<span class="badge badge-top"><i class="fa fa-crown"></i></span>';
  }else{
    ac='';
  }
  div2.innerHTML='<span id="badge_'+myUid+'" class="badge badge-btm"><i class="fa fa-microphone"></i></span>'+ac;
  

  img.src='https://picsum.photos/id/'+myUid+'/200/300';
  img.classList.add('prof');
  img.setAttribute('id','img_'+myUid);
  img.style.cssText = "width:60px;height: 60px;";

  h5.innerText=user;

  div2.append(img);
  div.append(div2);
  div.append(h5);

  //var avatar='<div class="text-center col-xs-3 col-sm-3 col-md-2"><img src="https://picsum.photos/id/'+USER_ID+'/200/300" class="prof" style=""/><h5>'+user+'</h5></div>';
  videoGrid.prepend(div);
  

}

function setAvatar(user,myUid){
  var div=document.createElement('div');
  var div2=document.createElement('div');
  var span_mic=document.createElement('span');

  var img=document.createElement('img');
  var h5=document.createElement('h5');


  let classesToAdd = [ 'text-center','col-xs-3','col-sm-3','col-md-2'];
  div.classList.add(...classesToAdd);
  //data-toggle="modal" data-target="#myModalTest"
  div.setAttribute('id','avatar_'+myUid);
  div.onclick=function(){ user_prof(myUid,user) }; 


  div2.classList.add('notif');
  if(ADMIN_ID===myUid){
    ac='<span class="badge badge-top"><i class="fa fa-crown"></i></span>';
  }else{
    ac='';
  }
  div2.innerHTML=ac;
  

  img.src='https://picsum.photos/id/'+myUid+'/200/300';
  img.classList.add('prof');
  img.setAttribute('id','img_'+myUid);
  img.style.cssText = "width:60px;height: 60px;";

  h5.innerText=user;

  div2.append(img);
  div.append(div2);
  div.append(h5);

  //var avatar='<div class="text-center col-xs-3 col-sm-3 col-md-2"><img src="https://picsum.photos/id/'+USER_ID+'/200/300" class="prof" style=""/><h5>'+user+'</h5></div>';
  lstnrGrid.prepend(div);
  
}

function removeAvatar(remid){
    var s=document.getElementById('avatar_'+remid);
    s.remove();
    //console.warn(remid);
}

function remoteaddVideoStream(video,myUid, stream) {
  //video.srcObject = (URL || webkitURL || mozURL).createObjectURL(stream);
  //console.warn("AA",stream)
  //const track = new MediaStream()
  //track.addTrack(stream)
  
  
  video.setAttribute('id','elem_'+myUid);
  video.setAttribute('autoPlay');
  video.srcObject = stream;
  
  
  videoGrid.append(video)
}

function addVideoStream(video,myUid, stream) {
  
  video.srcObject = stream

  video.setAttribute('id','elem_'+myUid);

  video.addEventListener('loadedmetadata', () => {
    video.play()
  });
  
  videoGrid.append(video)
}


function riseup(){
  socket.emit('raisehand',USER);
}

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
    socket.emit('mic-off',true);

  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
    socket.emit('mic-off',false);
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    myVideoStream.getTracks().forEach(function(track) {
      track.stop();
    });
    setPlayVideo()
    
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}
