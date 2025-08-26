import React, { useState, useRef, useCallback } from 'react';
import { FilePreview, UploadStatus } from '../../types/chat';
import { formatFileSize, isImageFile, isDocumentFile } from '../../services/chatServices';

interface FileUploadProps {
  onFilesSelected: (files: FilePreview[]) => void;
  onRemoveFile: (fileId: string) => void;
  selectedFiles: FilePreview[];
  uploadStatus: UploadStatus;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onRemoveFile,
  selectedFiles,
  uploadStatus,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }

    if (!isImageFile(file.type) && !isDocumentFile(file.type)) {
      return 'Unsupported file type. Please select images or documents only.';
    }

    return null;
  };

  const createFilePreview = (file: File): FilePreview => {
    const filePreview: FilePreview = {
      file,
      id: generateFileId(),
      type: isImageFile(file.type) ? 'image' : 'document',
    };

    // Create preview URL for images
    if (filePreview.type === 'image') {
      filePreview.previewUrl = URL.createObjectURL(file);
    }

    return filePreview;
  };

  const handleFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    const totalFiles = selectedFiles.length + fileArray.length;

    if (totalFiles > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    const validFiles: FilePreview[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(createFilePreview(file));
      }
    });

    if (errors.length > 0) {
      alert(`File validation errors:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      onFilesSelected([...selectedFiles, ...validFiles]);
    }
  }, [selectedFiles, maxFiles, maxFileSize, onFilesSelected]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleClick = () => {
    if (!uploadStatus.uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const file = selectedFiles.find(f => f.id === fileId);
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    onRemoveFile(fileId);
  };

  const getFileIcon = (fileType: string) => {
    if (isImageFile(fileType)) {
      return '🖼️';
    }
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
    return '📎';
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : uploadStatus.uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          onChange={handleFileInputChange}
          disabled={uploadStatus.uploading}
          className="hidden"
        />
        
        {uploadStatus.uploading ? (
          <div className="space-y-2">
            <div className="text-blue-600">📤</div>
            <div>Uploading files...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{uploadStatus.progress}% complete</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400 text-3xl">📎</div>
            <div className="text-gray-600">
              <div>Drop files here or click to browse</div>
              <div className="text-sm text-gray-500 mt-1">
                Images, PDFs, and documents up to {formatFileSize(maxFileSize)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {uploadStatus.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {uploadStatus.error}
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((filePreview) => (
              <div
                key={filePreview.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {filePreview.previewUrl ? (
                    <img
                      src={filePreview.previewUrl}
                      alt={filePreview.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
                      <span className="text-lg">
                        {getFileIcon(filePreview.file.type)}
                      </span>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {filePreview.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(filePreview.file.size)} • {filePreview.type}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFile(filePreview.id)}
                  disabled={uploadStatus.uploading}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;



