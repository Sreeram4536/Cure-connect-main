import React from 'react';
import { useSocket } from '../../context/SocketContext';

const SocketStatus: React.FC = () => {
  const { isConnected, socket } = useSocket();

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border z-50">
      <div className="flex items-center space-x-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          Socket: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {socket && (
        <div className="text-xs text-gray-500 mt-1">
          ID: {socket.id?.substring(0, 8)}...
        </div>
      )}
    </div>
  );
};

export default SocketStatus; 