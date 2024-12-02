export const iceConfiguration = {
  iceServers: [
    // {
    //   urls: "stun:stun.l.google.com:19302", // Public STUN server
    // },
    {
      urls: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
    {
      urls: "turn:192.158.29.39:3478?transport=udp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      urls: "turn:192.158.29.39:3478?transport=tcp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      urls: "turn:turn.bistri.com:80",
      credential: "homeo",
      username: "homeo",
    },
    {
      urls: "turn:turn.anyfirewall.com:443?transport=tcp",
      credential: "webrtc",
      username: "webrtc",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};
