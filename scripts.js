



//var room_id = "testroom";// getParameterByName('room_code'); 
 
var call;
var mypeerid;
var conn;
 
var peer = new Peer();

 peer.on('open', function(id) {
 console.log('My peer ID is: ' + id);

  
 

 ManageOnlineOffline(id)

 $('mypeerid').html(id)
 mypeerid=id;
 $('.after').show();
});
function  ManageOnlineOffline(peer_id){
// any time that connectionsRef's value is null (i.e. has no children) I am offline
var roomsRef = firebase.database().ref('users/rooms/'+room_id+'/users/'+peer_id);

var connectedRef = firebase.database().ref('.info/connected');
connectedRef.on('value', (snap) => {
  if (snap.val() === true) {


    // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
    var con = roomsRef.push();

    // When I disconnect, remove this device
    con.onDisconnect().remove();

    // Add this device to my connections list
    // this value could contain info about the device or a timestamp too
    con.set(true);

     
  }
});

}


navigator.getUserMedia = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia;






 

 $('#callBtn').click(function(){
var input_peerid=$('#input_peerid').val();
connectPeer(input_peerid);
 })

 function connectPeer(peer_id){
   console.log("connecting peer: "+peer_id);

     conn = peer.connect(peer_id, {reliable: true});
     conn.on('open', function() {
       // Receive messages
       conn.on('data', function(data) {
        console.log('Received', data);
       });

       console.log("serialization:",conn.serialization)
      
   
       
     });
  // doWithConn(conn);


 }

 peer.on('connection', function(conn) {
   
  console.log("incoming connection ")

  conn.on('data', function(data) {
  // console.log(data)
   if(data.type=="progress_info")
   {
    console.log("Sent Data feedback",data)
    if(data.msg==100){
        $('.drop-area').show();
        $('.stats-area').hide();
    }
    $('#progress').html(data.msg+"%")
    $('#speed').html(data.speed+"")

    $('.progress-bar-fill').attr('style',  'width:'+data.msg+'%');
   }
    if(data.file_name)
    {
       // console.log('[incoming] DATA', data.file_name+" mime:"+data.mime);
   handleData(data)
        $('#filename-text').html(data.file_name)
    }
   

   
 });

 });

 function sendMsg(msg)
 {
   console.log('[sending]', msg);
conn.send(msg);
 }

 var chunkLength = 1000*6000,file_size,file_name;
 $('#sendFileBtn').click(function(){
   var file = document.getElementById('fileinput').files[0];
   file_name=file.name;  file_size=file.size;
//     var reader = new window.FileReader();
// reader.readAsDataURL(file);
// reader.onload = onReadAsDataURL;
sliceandsend(file);


 })
 
 function sliceandsend(file) {
   var fileSize = file.size;
   var name = file.name;
   var mime = file.type;
   var chunkSize = 64 * 1024; // bytes
   var offset = 0;
   var sendProgress=0;

function readchunk(first) {
 var data = {}; // data object to transmit over data channel

   data.file_name=file_name;
   data.file_size=file_size;
   var r = new FileReader();
   var blob = file.slice(offset, chunkSize + offset);
   r.onload = function(evt) {
       if (!evt.target.error) {
           offset += chunkSize;
           //console.log("sending: " + (offset / fileSize) * 100 + "%");

           $('#filetransfer-text').html("Uploading")
           $('.drop-area').hide();
           $('.stats-area').show();
           $('#filename-text').html(file_name)

           //sendProgress=(offset / fileSize) * 100
           //sendProgress=parseFloat(sendProgress+"").toFixed(2)

         

           if (offset >= fileSize) {
             data.message = evt.target.result;
             data.last = true;
             data.mime = mime;
             conn.send(data);
               
             console.log(evt.target.result)
               //con.send(evt.target.result); ///final chunk
               console.log("Done reading file " + name + " " + mime);
             
               return;
           }
           else {      
             data.message = evt.target.result;
             data.last = false; 
             data.mime = mime;
             conn.send(data);             
               //con.send(evt.target.result);
           }               
       } else {
           console.log("Read error: " + evt.target.error);
           return; 
       }
       readchunk();
      };
       r.readAsArrayBuffer(blob);
   }
   readchunk(Math.ceil(fileSize/chunkSize));
 }


function onReadAsDataURL(event, text) {
   var data = {}; // data object to transmit over data channel

   data.file_name=file_name;
   data.file_size=file_size;
   if (event) text = event.target.result; // on first invocation

   if (text.length > chunkLength) {
       data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
   } else {
       data.message = text;
       data.last = true;
   }

   //console.log("sending: " + (offset / file_size) * 100 + "%");

   conn.send(data); // use JSON.stringify for chrome!

   var remainingDataURL = text.slice(data.message.length);
   if (remainingDataURL.length) setTimeout(function () {
       onReadAsDataURL(null, remainingDataURL); // continue transmitting
   }, 50)
}

var receivedSize=0; var recProgress=0;
var arrayToStoreChunks = [];
var counterBytes=0;
 function handleData (data) {
    
    $('#filetransfer-text').html("Downloading")
    $('.drop-area').hide();
     $('.stats-area').show();
   //console.log("data is",data.message)

   receivedSize += data.message.byteLength;
   counterBytes=counterBytes+receivedSize;
 //console.log("Downloading: "+receivedSize+" of "+data.file_size+" "+(receivedSize/data.file_size)*100+"%") 
 recProgress=(receivedSize/data.file_size)*100;
 recProgress=parseFloat(recProgress+"").toFixed(2)




 if (!data.last) {
$('#progress').html(recProgress+"%")

$('.progress-bar-fill').attr('style',  'width:'+recProgress+'%');
 }
   //console.log("storing in chunk")

   arrayToStoreChunks.push(data.message); // pushing chunks in array

   if(recProgress>0){
    var speed=formatBytes(counterBytes/1000,2)+"/s";
    var sdata = {};
    sdata.type="progress_info";
    sdata.msg=recProgress; 
    sdata.speed=speed;
    console.log("trying to send",sdata)
  
    sendMsg(sdata)
    }
   if (data.last) {
    setTimeout(function(){
         
        $('#progress').html(100+"%")

        $('.progress-bar-fill').attr('style',  'width:'+100+'%');
    },100)

    setTimeout(function(){
        $('.drop-area').show();
        $('.stats-area').hide();
         
            var speed=0
            var sdata = {};
            sdata.type="progress_info";
            sdata.msg=100; 
            sdata.speed=0;
            console.log("trying to send",sdata)
          
            sendMsg(sdata)
           
    },500)
    
     const received = new Blob(arrayToStoreChunks);
    // saveToDisk(arrayToStoreChunks.join(''), data.file_name,data.file_size,data.mime);
    downloadBuffer( URL.createObjectURL(received), data.file_name,data.file_size,data.mime);
     arrayToStoreChunks = []; // resetting array
     recProgress=0;
     receivedSize=0;

   }

   
};

function formatBytes(bytes, decimals = 2) {
 if (bytes === 0) return '0 Bytes';

 const k = 1024;
 const dm = decimals < 0 ? 0 : decimals;
 const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

 const i = Math.floor(Math.log(bytes) / Math.log(k));

 return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

var totalBytesSpeed=0;
var i=0;
setInterval(function(){
 console.log(formatBytes(counterBytes/100,2)+"/s")
 if(i%10==0)
 {
    $('#speed').html(formatBytes(counterBytes/1000,2)+"/s")
    
 }
if(counterBytes/1000>0)
 {

   totalBytesSpeed+=counterBytes/1000;
   $('.speedlogs').html(formatBytes(counterBytes/1000,2)+"/s<br>")
  
   } 
    counterBytes=0;
    i++;
},100)

 

function downloadBuffer(fileUrl, fileName,fileSize,mime) {

 $('msglist').append('<a download="'+fileName+'" href="'+fileUrl+'">'+fileName+'('+fileSize/1000+'KB)</a>')
  
}
function saveToDisk(fileUrl, fileName,fileSize,mime) {
 console.log("FINAL FILE:",new ArrayfileUrl)
   console.log("Generating donwload URL")
   $('msglist').append('<a download="'+fileName+'" href="'+fileUrl+'">'+fileName+'('+fileSize/1000+'KB)</a>')
   var save = document.createElement('a');
   save.href = fileUrl;
   save.target = '_blank';
   save.download = fileName || fileUrl;

   var event = document.createEvent('Event');
   event.initEvent('click', true, true);

   save.dispatchEvent(event);
   (window.URL || window.webkitURL).revokeObjectURL(save.href);



//     var bytes = fileUrl;
  
//     // pass your byte response to this constructor

// var blob=new Blob([bytes], {type: mime});// change resultByte to bytes
// var bytes = new Uint8Array(fileUrl);

// var src = 'data:'+mime+';base64,'+encode(bytes);

// console.log(src)
// var link=document.createElement('a');
// link.href=window.URL.createObjectURL(blob);
// link.download=fileName;
// link.click();
}

 
// public method for encoding an Uint8Array to base64
function encode (input) {
 var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var output = "";
 var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
 var i = 0;

 while (i < input.length) {
     chr1 = input[i++];
     chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
     chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

     enc1 = chr1 >> 2;
     enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
     enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
     enc4 = chr3 & 63;

     if (isNaN(chr2)) {
         enc3 = enc4 = 64;
     } else if (isNaN(chr3)) {
         enc4 = 64;
     }
     output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
               keyStr.charAt(enc3) + keyStr.charAt(enc4);
 }
 return output;
}




function getParameterByName(name, url = window.location.href) {
   name = name.replace(/[\[\]]/g, '\\$&');
   var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
       results = regex.exec(url);
   if (!results) return null;
   if (!results[2]) return '';
   return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
