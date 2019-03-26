var ws = new WebSocket("ws://60.205.225.215:8800");

ws.onopen = function(){
    ws.send("进入交流区");
}

ws.onmessage = function(e){
    $(".chat_show").append($("<div class='row chat_getmsg'>").html(e.data));
}

ws.onclose = function(){
    alert("socket服务器关闭");
}

ws.onerror = function(){
    alert("socket服务器错误");
}