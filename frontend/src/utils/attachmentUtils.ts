// Utility functions for handling attachments and URL conversions

export interface AttachmentObject {
  type: 'image' | 'file' | 'video' | 'audio' | 'url';
  asset_url?: string;
  image_url?: string;
  file_url?: string;
  thumb_url?: string;
  title?: string;
  name?: string;
  size?: number;
  mime_type?: string;
}

/**
 * Converts a URL string to a proper Attachment object
 * @param url - The URL string to convert
 * @param type - The type of attachment (default: 'file')
 * @param additionalProps - Additional properties to include in the attachment
 * @returns Properly formatted Attachment object
 */
export const createAttachmentFromUrl = (
  url: string, 
  type: AttachmentObject['type'] = 'file',
  additionalProps: Partial<AttachmentObject> = {}
): AttachmentObject => {
  const baseAttachment: AttachmentObject = {
    type,
    asset_url: url,
    ...additionalProps
  };

  // Add type-specific URL properties
  switch (type) {
    case 'image':
      baseAttachment.image_url = url;
      break;
    case 'file':
      baseAttachment.file_url = url;
      break;
    case 'video':
      baseAttachment.asset_url = url;
      break;
    case 'audio':
      baseAttachment.asset_url = url;
      break;
    case 'url':
      baseAttachment.asset_url = url;
      break;
  }

  return baseAttachment;
};

/**
 * Converts an array of URL strings to an array of Attachment objects
 * @param urls - Array of URL strings
 * @param type - The type of attachments (default: 'file')
 * @returns Array of Attachment objects
 */
export const createAttachmentsFromUrls = (
  urls: string[], 
  type: AttachmentObject['type'] = 'file'
): AttachmentObject[] => {
  return urls.map(url => createAttachmentFromUrl(url, type));
};

/**
 * Validates if a string is a valid URL
 * @param url - String to validate
 * @returns boolean indicating if the string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the file type from a URL based on its extension
 * @param url - The URL to analyze
 * @returns The detected attachment type
 */
export const getAttachmentTypeFromUrl = (url: string): AttachmentObject['type'] => {
  const extension = url.split('.').pop()?.toLowerCase();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
  
  if (extension) {
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
  }
  
  return 'file';
};