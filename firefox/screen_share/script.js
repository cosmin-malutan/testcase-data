var player = document.getElementById("player");
var requireh264 = document.getElementById("requireh264");

var pc1;
var pc2;

var pc1_offer;
var pc2_answer;

function start() {
  pc1 = new mozRTCPeerConnection();
  pc2 = new mozRTCPeerConnection();

  pc2.onaddstream = function(obj) {
    player.mozSrcObject = obj.stream;
    player.play();
  };

  var constraints = {video: {mozMediaSource: "application",
                             mediaSource: "application"}};
  navigator.mozGetUserMedia(constraints, function(aVideo) {
    // Add stream obtained from gUM to <video> to start media flow.
    pc1.addStream(aVideo);
    pc1.createOffer(step1Callback, errorCallback, {offerToReceiveVideo: false,
                                                   offerToReceiveAudio: false });
  }, errorCallback);
}

function stop() {
  pc1.close();
  pc2.close();
}

/**
 * Callback to be used for asynchronous calls that uses
 *
 * @param aCode
 */
function errorCallback(aCode) {
  console.log("Failure callback: " + JSON.stringify(aCode));
}

// pc1.createOffer finished, call pc1.setLocal
function step1Callback(aOffer) {
  if (requireh264.checked) {
    // to enforce the usage of H264 we remove the VP8 codec from the offer
    aOffer.sdp = removeVP8(aOffer.sdp);
    console.log("No VP8 Offer");
    if (!aOffer.sdp.match(/a=rtpmap:[0-9]+ H264/g)) {
      console.log("No H264 found in the offer!!!");
      return;
    }
  }
  pc1_offer = aOffer;
  pc1.setLocalDescription(aOffer, step2Callback, errorCallback);
}

// Also remove mode 0 if it's offered
// Note, we don't bother removing the fmtp lines, which makes a good test
// for some SDP parsing issues.
function removeVP8(sdp) {
  updated_sdp = sdp.replace("a=rtpmap:120 VP8/90000\r\n","");
  updated_sdp = updated_sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 120/g, "m=video $1 RTP\/SAVPF $2");
  updated_sdp = updated_sdp.replace(/m=video ([0-9]+) RTP\/SAVPF 120([0-9 ]*)/g, "m=video $1 RTP\/SAVPF$2");
  updated_sdp = updated_sdp.replace("a=rtcp-fb:120 nack\r\n","");
  updated_sdp = updated_sdp.replace("a=rtcp-fb:120 nack pli\r\n","");
  updated_sdp = updated_sdp.replace("a=rtcp-fb:120 ccm fir\r\n","");
  return updated_sdp;
}

// pc1.setLocal finished, call pc2.setRemote
function step2Callback() {
  pc1.onicecandidate = function(aEvent) {
    if (aEvent.candidate) {
      console.log("pc1 found ICE candidate: " + JSON.stringify(aEvent.candidate));
      pc2.addIceCandidate(aEvent.candidate);
    } else {
      console.log("pc1 got end-of-candidates signal");
    }
  };

  pc2.setRemoteDescription(pc1_offer, step3Callback, errorCallback);
}

// pc2.setRemote finished, call pc2.createAnswer
function step3Callback() {
  pc2.createAnswer(step4Callback, errorCallback, {offerToReceiveVideo : true,
                                                  offerToReceiveAudio: true });
}

// pc2.createAnswer finished, call pc2.setLocal
function step4Callback(aAnswer) {
  console.log("Answer:  " + aAnswer.sdp);
  pc2_answer = aAnswer;

  if (requireh264.checked) {
    if (aAnswer.sdp.match(/a=rtpmap:[0-9]+ H264/g)) {
      pc2.setLocalDescription(aAnswer, step5Callback, errorCallback);
    } else {
      console.log("No H264 found in the answer!!!");
    }
  } else {
    pc2.setLocalDescription(aAnswer, step5Callback, errorCallback);
  }
}

// pc2.setLocal finished, call pc1.setRemote
function step5Callback() {
  pc1.setRemoteDescription(pc2_answer, step6Callback, errorCallback);
}

// pc1.setRemote finished, media should be running!
function step6Callback() {
  document.getElementById("sharingStarted").checked = true;
}