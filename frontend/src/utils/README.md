# Attachment Utilities

This module provides utility functions to handle URL-to-Attachment type conversions, particularly useful when working with chat systems that require properly formatted attachment objects instead of plain URL strings.

## Problem

When working with TypeScript and chat libraries (like stream-chat), you might encounter errors like:
```
Type 'string' is not assignable to type 'Attachment'.ts(2322)
(parameter) url: string
```

This happens when you try to pass a URL string directly to a function that expects an Attachment object.

## Solution

Use the provided utility functions to convert URL strings to properly formatted Attachment objects.

## Usage Examples

### Basic URL to Attachment Conversion

```typescript
import { createAttachmentFromUrl } from './attachmentUtils';

// Convert a simple URL string to an attachment
const imageUrl = "https://example.com/image.jpg";
const attachment = createAttachmentFromUrl(imageUrl, 'image');

// Result:
// {
//   type: 'image',
//   asset_url: 'https://example.com/image.jpg',
//   image_url: 'https://example.com/image.jpg'
// }
```

### Multiple URLs to Attachments

```typescript
import { createAttachmentsFromUrls } from './attachmentUtils';

const urls = [
  "https://example.com/file1.pdf",
  "https://example.com/file2.docx"
];

const attachments = createAttachmentsFromUrls(urls, 'file');
```

### Auto-detect Attachment Type

```typescript
import { getAttachmentTypeFromUrl, createAttachmentFromUrl } from './attachmentUtils';

const url = "https://example.com/video.mp4";
const type = getAttachmentTypeFromUrl(url); // Returns 'video'
const attachment = createAttachmentFromUrl(url, type);
```

### Validate URLs

```typescript
import { isValidUrl } from './attachmentUtils';

const url = "https://example.com/file.pdf";
if (isValidUrl(url)) {
  // Proceed with attachment creation
  const attachment = createAttachmentFromUrl(url);
}
```

## Common Use Cases

### In Chat Components

```typescript
// Before (causes TypeScript error):
// sendMessage(conversationId, message, 'text', [url]); // Error!

// After (works correctly):
import { createAttachmentFromUrl } from '../utils/attachmentUtils';

const attachment = createAttachmentFromUrl(url, 'image');
sendMessage(conversationId, message, 'text', [attachment]);
```

### Processing File Uploads

```typescript
import { createAttachmentFromUrl, getAttachmentTypeFromUrl } from '../utils/attachmentUtils';

const handleFileUpload = (uploadedFileUrl: string) => {
  const type = getAttachmentTypeFromUrl(uploadedFileUrl);
  const attachment = createAttachmentFromUrl(uploadedFileUrl, type, {
    title: 'Uploaded File',
    size: fileSize,
    mime_type: fileMimeType
  });
  
  // Now you can safely pass this to functions expecting Attachment objects
  addAttachmentToMessage(attachment);
};
```

## API Reference

### `createAttachmentFromUrl(url, type?, additionalProps?)`
Converts a URL string to an Attachment object.

**Parameters:**
- `url: string` - The URL to convert
- `type?: AttachmentType` - Optional type ('image' | 'file' | 'video' | 'audio' | 'url'), defaults to 'file'
- `additionalProps?: Partial<AttachmentObject>` - Optional additional properties

**Returns:** `AttachmentObject`

### `createAttachmentsFromUrls(urls, type?)`
Converts an array of URL strings to Attachment objects.

**Parameters:**
- `urls: string[]` - Array of URLs to convert
- `type?: AttachmentType` - Optional type for all attachments, defaults to 'file'

**Returns:** `AttachmentObject[]`

### `getAttachmentTypeFromUrl(url)`
Auto-detects the attachment type based on file extension.

**Parameters:**
- `url: string` - The URL to analyze

**Returns:** `AttachmentType`

### `isValidUrl(url)`
Validates if a string is a valid URL.

**Parameters:**
- `url: string` - String to validate

**Returns:** `boolean`