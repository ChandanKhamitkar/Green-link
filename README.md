# Simple WebRTC Video Chat with Node.js Signaling Server

This project demonstrates a basic peer-to-peer video chat application using WebRTC.  It utilizes a Node.js server as a signaling server to facilitate the initial connection and exchange of SDP offers/answers and ICE candidates between peers.

## Overview

WebRTC (Web Real-Time Communication) allows browsers to communicate directly with each other, enabling real-time communication features like video chat and screen sharing without the need for a central server to relay media streams. However, a signaling server is required to orchestrate the initial connection. This project provides that server.

The application consists of two parts:

1. **Client-Side (Frontend):** Two React applications (host and peer) handle user interface and WebRTC functionality.
2. **Server-Side (Backend):** A Node.js server using Express.js and Socket.IO handles the signaling process, allowing peers to exchange information needed to establish a connection.

## Functionality

* **Room Creation:**  A unique room ID is used to connect two users.
* **Peer Connection:** The frontend applications initiate a peer-to-peer connection using WebRTC's APIs.
* **Signaling:** The signaling server relays SDP offers/answers and ICE candidates between the peers, enabling them to establish a connection.
* **Media Streaming:** Once connected, the peers exchange video and audio streams.
* **Error Handling:** Basic error handling is included for common WebRTC issues.


## Technology Stack

* **Frontend:** React, Next.js (for routing)
* **Backend:** Node.js, Express.js, Socket.IO
* **WebRTC:**  The core technology for peer-to-peer communication.


## Getting Started

**Prerequisites:**

* Node.js and npm installed.

**Steps:**

1. **Clone the repository:**  `git clone https://github.com/ChandanKhamitkar/Green-link.git`
2. **Install dependencies:**
   ```bash
   cd backend  // Navigate to the server directory
   npm install
   cd ../frontend // Navigate to the client directory
   npm install
   ```
3. **Start the server:**  Navigate to the `backend` directory and run:  `npm run dev`
4. **Start the frontend application:** Navigate to the `frontend` directory and run: `npm run dev`.
5. **Open two browser windows**: Access the "host" and "peer" pages by adjusting the `/sender/<roomid>` and `/receiver/<roomid>` URLs (replace `<roomid>` with a common ID for both).
