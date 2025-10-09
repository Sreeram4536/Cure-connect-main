import React, { useState } from 'react';
import { ChatMessage, Attachment } from '../../types/chat';
import { formatFileSize, getFileUrlAPI, getFileExtension } from '../../services/chatServices';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onRestoreMessage?: (messageId: string) => void;
  onPermanentDeleteMessage?: (messageId: string) => void;
  showActions?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  onDeleteMessage,
  onRestoreMessage,
  onPermanentDeleteMessage,
  showActions = true,
}) => {
  const [showFullImage, setShowFullImage] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (attachment: Attachment) => {
    const extension = getFileExtension(attachment.originalName).toLowerCase();
    if (attachment.fileType === 'image') return '🖼️';
    if (extension === 'pdf') return '📄';
    if (['doc', 'docx'].includes(extension)) return '📝';
    if (['xls', 'xlsx'].includes(extension)) return '📊';
    if (['ppt', 'pptx'].includes(extension)) return '📋';
    return '📎';
  };

  const handleFileClick = (attachment: Attachment) => {
    if (attachment.fileType === 'image') {
      setShowFullImage(getFileUrlAPI(attachment.fileName));
    } else {
      // Download the file
      const link = document.createElement('a');
      link.href = getFileUrlAPI(attachment.fileName);
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleActionClick = (action: string) => {
    setShowActionsMenu(false);
    switch (action) {
      case 'delete':
        onDeleteMessage?.(message.id);
        break;
      case 'restore':
        onRestoreMessage?.(message.id);
        break;
      case 'permanent_delete':
        if (window.confirm('Are you sure you want to permanently delete this message? This action cannot be undone.')) {
          onPermanentDeleteMessage?.(message.id);
        }
        break;
    }
  };

  const renderAttachment = (attachment: Attachment, index: number) => {
    const fileUrl = getFileUrlAPI(attachment.fileName);
    
    if (attachment.fileType === 'image') {
      return (
        <div key={index} className="mt-2">
          <img
            src={fileUrl}
            alt={attachment.originalName}
            className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleFileClick(attachment)}
            loading="lazy"
          />
          <div className="text-xs text-gray-500 mt-1">
            {attachment.originalName} • {formatFileSize(attachment.fileSize)}
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className="mt-2 p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => handleFileClick(attachment)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFileIcon(attachment)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {attachment.originalName}
            </div>
            <div className="text-xs text-gray-500">
              {formatFileSize(attachment.fileSize)} • Click to download
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
          <div
            className={`px-4 py-2 rounded-lg ${
              message.isDeleted
                ? 'bg-red-100 border border-red-200'
                : isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-900'
            } ${showActions && isOwn ? 'group relative' : ''}`}
          >
            {/* Message Content */}
            {message.isDeleted ? (
              <div className="italic text-red-600">
                <span className="text-sm">🗑️ Message deleted</span>
                {message.deletedAt && (
                  <div className="text-xs mt-1">
                    Deleted on {new Date(message.deletedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Text Message */}
                {message.message && (
                  <div className="text-sm">{message.message}</div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-2">
                    {message.attachments.map((attachment, index) =>
                      renderAttachment(attachment, index)
                    )}
                  </div>
                )}
              </>
            )}

            {/* Actions Menu Button */}
            {showActions && isOwn && !message.isDeleted && (
              <button
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-gray-200"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            )}

            {/* Actions Menu for Deleted Messages */}
            {showActions && isOwn && message.isDeleted && (
              <div className="mt-2 flex gap-2">
                <button
                  className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={() => handleActionClick('restore')}
                >
                  Restore
                </button>
                <button
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => handleActionClick('permanent_delete')}
                >
                  Delete Forever
                </button>
              </div>
            )}
          </div>

          {/* Actions Dropdown */}
          {showActionsMenu && !message.isDeleted && (
            <div className={`absolute z-10 mt-1 ${isOwn ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-md shadow-lg`}>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => handleActionClick('delete')}
              >
                Delete Message
              </button>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.timestamp)}
            {message.isRead && isOwn && <span className="ml-1 text-blue-500">✓</span>}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowFullImage(null)}
        >
          <div className="relative max-w-4xl max-h-4xl">
            <img
              src={showFullImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
              onClick={() => setShowFullImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageItem;









