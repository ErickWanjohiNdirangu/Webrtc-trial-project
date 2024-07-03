const localPeer = document.querySelector(".localPeer");
const remotePeer = document.querySelector(".remotePeer");
const servers = {
  iceServers: [
    {
      urls: ["stun:stun.ekiga.net", "stun:stun1.l.google.com:19302"],
    },
  ],
};

const socket = io();

socket.on("serverResponse", (msg) =>
  console.log(`new ${msg.type} message from peer`, msg)
);

const initialize = async () => {
  const peerConnection = new RTCPeerConnection(servers);

  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  let remoteStream = new MediaStream();

  localPeer.srcObject = localStream;
  remotePeer.srcObject = remoteStream;
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
      console.log("remote track added");
    });
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("your new ice Candidate", event.candidate);

      socket.emit("signalling", {
        type: "candidate",
        responseSent: event.candidate,
      });
    }
  };

  createOffer(peerConnection);
  handleMessagesFromPeer(peerConnection);

  //   setTimeout(() => {
  //     console.log("money minting");
  //     console.log(peerConnection.currentRemoteDescription);
  //   }, 5000);
};

const createOffer = async (peerConnection) => {
  const offer = await peerConnection.createOffer();
  console.log("your offer is:", offer);
  await peerConnection.setLocalDescription(offer);

  socket.emit("signalling", { type: "offer", responseSent: offer });
};

const createAnswer = async (peerConnection, offer) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("signalling", { type: "answer", responseSent: answer });
};

const handleMessagesFromPeer = async (peerConnection) => {
  socket.on("serverResponse", (msg) => {
    if (msg.type === "offer") {
      createAnswer(peerConnection, msg.responseSent);
    }

    if (msg.type === "answer") {
      addAnswer(peerConnection, msg.responseSent);
    }

    if (msg.type === "candidate") {
      addIceCandidate(peerConnection, msg.responseSent);
    }
  });
};

let addAnswer = async (peerConnection, answer) => {
  if (!peerConnection.currentRemoteDescription) {
    await peerConnection.setRemoteDescription(answer);
  }
};

let addIceCandidate = async (peerConnection, ice) => {
  await peerConnection.addIceCandidate(ice);
  console.log("ice candidate added:", ice);
};
initialize();
