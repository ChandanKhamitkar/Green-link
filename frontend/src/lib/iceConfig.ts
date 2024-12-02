export const iceConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "a8d2842aad0d3d071366e91c",
      credential: "s2nOs8Mg3XGy3Wic",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "a8d2842aad0d3d071366e91c",
      credential: "s2nOs8Mg3XGy3Wic",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "a8d2842aad0d3d071366e91c",
      credential: "s2nOs8Mg3XGy3Wic",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "a8d2842aad0d3d071366e91c",
      credential: "s2nOs8Mg3XGy3Wic",
    },
],
};
