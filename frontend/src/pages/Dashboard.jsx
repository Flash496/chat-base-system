import React from 'react';
  import Sidebar from '../components/Sidebar';
  import ChatWindow from '../components/ChatWindow';
  import { useSocket, SocketProvider } from '../context/SocketContext';

  const DashboardContent = () => {
    const { activeChat } = useSocket();

    return (
      <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden">
        {/* On mobile: show Sidebar if activeChat is empty, else show ChatWindow */}
        {/* On desktop: show both side-by-side */}
        <div className={`h-full w-full md:w-80 flex-shrink-0 ${activeChat ? 'hidden md:block' : 'block'}`}>
          <Sidebar />
        </div>
        <div className={`h-full flex-grow ${activeChat ? 'block' : 'hidden md:block'}`}>
          <ChatWindow />
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    return (
      <SocketProvider>
        <DashboardContent />
      </SocketProvider>
    );
  };

  export default Dashboard;
