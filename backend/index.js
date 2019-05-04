const fs = require("fs");

// TODO: Prior to execute this program
// you need to set two environment variables
// 1. DYC_ROOMID - for streamer's room id (required)
// 2. DYC_STREAMER_NN - streamer nickname, to check and give different color differentiate from other users (required)
// 3. DYC_OUTPUT_HTML_PATH - for output path of generated html file, if empty then default to /tmp/douyu-chat.html
// 4. DYC_KEEP_NUM_MSG - number of latest messages to keep, if not default to 20

var roomID;
if (!process.env.DYC_ROOMID)
{
  console.log("DYC_ROOMID environment variable needs to be set prior to start this program\n");
  process.exit(1);
}
else
{
  roomID = process.env.DYC_ROOMID;
}

var streamer_nn;
if (!process.env.DYC_STREAMER_NN)
{
  console.log("DYC_STREAMER_NN environment variable needs to be set prior to start this program\n");
  process.exit(1);
}
else
{
  streamer_nn = process.env.DYC_STREAMER_NN;
}

var destination_html_output = "/tmp/douyu-chat.html";
if (process.env.DYC_OUTPUT_HTML_PATH)
{
  destination_html_output = process.env.DYC_OUTPUT_HTML_PATH;
}

// keep the last N messages
// this should be enough to show in one full height of
// chatbox in streaming app i.e. obs
let keep_num_last_msg = 20;
if (process.env.DYC_KEEP_NUM_MSG)
{
  keep_num_last_msg = process.env.DYC_KEEP_NUM_MSG;
}

// print summary of configurations used
console.log("Output HTML at: " + destination_html_output + "\nMsgs keep: " + keep_num_last_msg + "\n");

// output to html format
function output_html(dest_path, msg_objs)
{
  var html_str = `<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="3">
    <link rel="stylesheet" type="text/css" href="css/style.css"/>
  </head>
  <body>
  </br>
  </br>
  <div class="chatbox">
  `;

  if (msg_objs.length == 0)
  {
    html_str += "Still quiet...</br>";
    html_str += "You can say hi :)";
  }
  else
  {
    for (var i=0; i<msg_objs.length; ++i)
    {
      var msg = msg_objs[i];

      // check nickname if matches, then it's stream
      // FIXME: should use user id (uid) instead but it's inconvenient for users to get this information, using nick name is fine though for now
      if (msg.nn == streamer_nn)
      {
        html_str += `<div class="msg-wrapper">
      <div class="msg-wrapper">
          <span class="streamer">${msg_objs[i].nn}</span> <span class="msg">${msg_objs[i].txt}</span>
      </div>`;

      }
      else
      {
        html_str += `<div class="msg-wrapper">
      <div class="msg-wrapper">
          <span class="user">${msg_objs[i].nn}</span> <span class="msg">${msg_objs[i].txt}</span>
      </div>`;
      }
    }
  }

  // footer
  html_str += "</div></body></html>";

  // write into file with one call
  fs.writeFile(dest_path, html_str, function(err) {
    if (err)
    {
      console.log(err);
      return;
    }
  });
}

// Import library
var douyu = require('douyu');

var room = new douyu.ChatRoom(roomID);



var msg_objs = [];

// System level events handler
room.on('connect', function(message){
	console.log('DouyuTV ChatRoom #' + roomID + ' connected.');

  // write to html file even there's no msgs
  // to indicate quiet stage
  output_html(destination_html_output, msg_objs);
});
room.on('error', function(error){
	console.error('Error: ' + error.toString());
});
room.on('close', function(hasError){
	console.log('DouyuTV ChatRoom #' + roomID + ' disconnected' + hasError ? ' because of error.' : '.');
});

// Chat server events
room.on('chatmsg', function(message){
  console.log('[' + message.nn + ']: ' + message.txt);
  msg_objs.push(message);

  // if msg length is more than what we've set
  // then remove the first one
  if (msg_objs.length > keep_num_last_msg)
  {
    msg_objs.shift();
  }

  output_html(destination_html_output, msg_objs);
});

// monitor user entered into the room
room.on('uenter', function(message){
  console.log('--[' + message.nn + ']: entered into chat room--');
});

// Knock, knock ...
room.open();
