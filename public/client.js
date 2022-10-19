var d=new Date();
var bt=document.createElement('button');
var mod_av_name=document.getElementById('av_name');
var frn_state=document.getElementById('action');
var fl=document.getElementById('follow');
var controls=document.getElementById('controls');


function cancelFullScreen() {
    var el = document;
    var requestMethod = el.cancelFullScreen||el.webkitCancelFullScreen||el.mozCancelFullScreen||el.exitFullscreen||el.webkitExitFullscreen;
    if (requestMethod) { // cancel full screen.
        requestMethod.call(el);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

function requestFullScreen(el) {
    // Supports most browsers and their versions.
    var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(el);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
    return false
}


function toggleFullScreen(el) {
    if (!el) {
        el = document.body; // Make the body go full screen.
    }
    var isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||  (document.mozFullScreen || document.webkitIsFullScreen);

    if (isInFullScreen) {
        cancelFullScreen();
    } else {
        requestFullScreen(el);
    }
    return false;
}

function user_prof(myUid,user) {
    console.warn(user);
    check_follow(myUid);
    mod_av_name.textContent=user+'';
    $("#remove_user").on('click',function(){kick_user(myUid)});
    $('#myModal').modal('show');
}

function follow(fid){
    bt.innerHTML="<i class='fa fa-spin fa-spinner'></i> Follow";
    $.ajax({url:'/follow',type:'POST',data:{friend:fid,time:d.getTime()},success:function(data){
        if(data.state) action_btn_ufl(fid);
    }})
}

function unfollow(fid){
    //alert("UNFO")
    console.warn("ME:"+fid)
    bt.innerHTML="<i class='fa fa-spin fa-spinner'></i> Following";
    $.ajax({url:'/unfollow',type:'POST',data:{friend:fid,time:d.getTime()},success:function(data){
        if(data.state) action_btn_fl(fid);
    }})
}

function check_follow(fid){
    $.ajax({url:'/friendship',type:'POST',data:{friend:fid,time:d.getTime()},success:function(data){if(data.state==true){action_btn_ufl(fid)}else{action_btn_fl(fid);}}})
}


function action_btn_fl(fid){
    bt.className = '';
    bt.classList.add('btn', 'btn-md','btn-primary');//className = "btn btn-pill";
    bt.textContent="Follow";
    //bt.onclick=follow;
    bt.onclick=function(){ follow(fid) }; 
    if(frn_state) $(frn_state).html(bt);
}

function action_btn_ufl(fid){
    bt.className = '';
    bt.classList.add('btn', 'btn-md','btn-silent');//className = "btn btn-pill";
    bt.textContent="Following";
    //bt.onclick=unfollow;
    bt.onclick=function(){ unfollow(fid) }; 
    if(frn_state) $(frn_state).html(bt);
}

function join_room(room,el){
    //console.warn("JOIN RROM "+uId )
    $.ajax({url:'/newmember',type:'POST',data:{rm:room,token:'_token',time:d.getTime()},success:function(data){
        //console.log(data);
        //if(data.state && data.space) console.log("SPACE");
        if(data.state && data.space) window.location.href="/voice/"+data.uri;
        else notify('This room is full.');;
    }})
}



function notify(text) {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar"); 
    // Add the "show" class to DIV
    x.className = "show";
    x.innerText=text;
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 4000);
  }


