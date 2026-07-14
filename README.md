# Aura Chat Application

A full-stack, real-time secure messaging application built from scratch without external BaaS vendor APIs (like Firebase, Pusher, or Supabase). Aura Chat handles authentication, persistence, routing, and WebSockets through self-hosted custom servers.

## Tech Stack
*   **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons
*   **Backend:** Node.js + Express
*   **Real-time Layer:** Socket.IO (WebSockets connection protocol)
*   **Database:** MongoDB Atlas (via Mongoose ODM)
*   **Auth:** JSON Web Tokens (JWT) + Bcrypt Password Hashing

---

## Getting Started

### Prerequisites
*   Node.js (v16.x or higher)
*   npm (v7.x or higher)
*   MongoDB Instance (local server or Atlas connection URI)

---

### Installation & Configuration

1. Clone or navigate to the project directory:
   ```bash
   cd "chat base system"
   ```

2. **Setup the Backend:**
   *   Navigate to the backend directory:
       ```bash
       cd backend
       ```
   *   Install npm dependencies:
       ```bash
       npm install
       ```
   *   Create a `.env` file from the example:
       ```bash
       cp .env.example .env
       ```
   *   Edit the `.env` file variables:
       *   `PORT`: Port the server runs on (e.g. `5000`)
       *   `MONGO_URI`: MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/chat-db` or Atlas cluster URI)
       *   `JWT_SECRET`: Secret key for signing sessions
       *   `CLIENT_URL`: URL of the frontend (e.g. `http://localhost:5173`)

3. **Setup the Frontend:**
   *   Navigate to the frontend directory:
       ```bash
       cd ../frontend
       ```
   *   Install npm dependencies:
       ```bash
       npm install
       ```
   *   Create a `.env` file in `/frontend` or rely on the defaults:
       *   `VITE_API_URL` (Defaults to `http://localhost:5000/api`)
       *   `VITE_SOCKET_URL` (Defaults to `http://localhost:5000`)

---

### Running Locally

To run both servers concurrently for development:

1. **Start the Backend:**
   ```bash
   cd backend
   ```
   *   Development (with hot reloading):
       ```bash
       npm run dev
       ```
   *   Production:
       ```bash
       npm start
       ```

2. **Start the Frontend:**
   ```bash
   cd frontend
   ```
   *   Start dev server:
       ```bash
       npm run dev
       ```

Open [http://localhost:5173](http://localhost:5173) in your web browser to start chatting!
