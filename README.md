# ProtoChat — Minimalist Messaging Protocol

ProtoChat is a premium, full-stack, real-time secure messaging application built entirely from scratch. It utilizes self-hosted Node.js servers, custom MongoDB indexes, and optimized WebSockets to handle real-time delivery states, authentication, and push notifications without relying on external third-party BaaS vendors (like Firebase, Pusher, or Supabase).

---

## Key Features

### 💬 Real-Time Chat Engine
*   **Zero-Latency Handshake**: Socket.IO WebSockets keep communication channels open instantly.
*   **Instagram-Style Reactions**: Hover or tap message bubbles to select and apply emoji reactions (`👍 ❤️ 😂 😮 😢 🙏`).
*   **Quoted Threads & Replies**: Quote and reply to specific messages with nested parent previews.
*   **Message Receipts**: Real-time feedback tracking (`Sent` ➡️ `Delivered` ➡️ `Seen`).

### ⚙️ Chat & User Management
*   **Pin Conversations**: Float critical chats to the top of the sidebar.
*   **Mute Alerts**: Suppress notification audio and push cards on a per-user basis.
*   **Contact Blocking**: Lock incoming requests from unwanted users inside the chat header.
*   **Delete Chat**: Wipe complete chat histories and documents from the server.

### 🔔 System Alerts & Chimes
*   **Web Audio Synthesizer**: Programmatic high-fidelity notification chimes using standard browser oscillators (no audio file requests needed).
*   **System Push Notifications**: HTML5 desktop notification alerts triggered when the app is running in the background.

### 🖼️ Optimized Self-Hosted Avatars
*   **Canvas Compression**: Client-side canvas compression downscales profile pictures to 150x150 JPEG format (~10KB size) before uploading.
*   **Progress Indicators**: Interactive upload percentage overlays displayed over the profile avatar.

---

## Tech Stack

*   **Frontend**: React (Vite SPA) + Tailwind CSS + Lucide Icons
*   **Backend**: Node.js + Express.js
*   **Database**: MongoDB Atlas cloud cluster + Mongoose ODM (configured with custom compound indices on `{ chatId: 1, createdAt: -1 }`)
*   **Handshake/Websockets**: Socket.IO
*   **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing

---

## Getting Started

### Prerequisites
*   Node.js (v18.x or higher)
*   npm (v8.x or higher)
*   MongoDB Atlas URI or local MongoDB instance

### Installation

1.  **Configure Backend**:
    ```bash
    cd backend
    npm install
    ```
    Create a `backend/.env` file:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_atlas_uri
    JWT_SECRET=your_jwt_signing_secret_key
    CLIENT_URL=http://localhost:5173
    ```

2.  **Configure Frontend**:
    ```bash
    cd ../frontend
    npm install
    ```
    Create a `frontend/.env` file:
    ```env
    VITE_API_URL=http://localhost:5000/api
    VITE_SOCKET_URL=http://localhost:5000
    ```

---

## Running Locally

1.  **Launch Backend**:
    ```bash
    cd backend
    npm run dev
    ```
2.  **Launch Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Deployment Notes

### 1. Vercel SPA Routing Configuration
To prevent `404 Not Found` page errors when refreshing paths in your deployed client app on Vercel, a `vercel.json` file is configured in `/frontend` to redirect all route directories back to `index.html`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Environment Variables on Render/Vercel
Make sure to add the following variables to your host settings:
*   **Backend (Render)**: Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your deployed Vercel URL), and `PORT`.
*   **Frontend (Vercel)**: Set `VITE_API_URL` and `VITE_SOCKET_URL` pointing to your deployed backend URL.
