import { UploadedDoc } from '@/types/research';

export async function parseUploadedDocument(file: File): Promise<UploadedDoc> {
  const fileName = file.name;
  const fileType = file.type || '';
  const fileSize = file.size;

  let textContent = '';

  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      // For browser side file parsing, read array buffer or text
      const buffer = await file.arrayBuffer();
      // Try string decoding for standard text/pdf stream or basic extraction
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const raw = decoder.decode(buffer);
      // Clean readable text chunks
      const textChunks = raw
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 8000);
      textContent = textChunks || `[PDF Document: ${fileName}]`;
    } catch {
      textContent = `[PDF Content extracted from ${fileName}]`;
    }
  } else {
    // TXT, Markdown, JSON, CSV
    try {
      textContent = await file.text();
    } catch {
      textContent = `[Uploaded File: ${fileName}]`;
    }
  }

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    size: fileSize,
    type: fileType || 'text/plain',
    content: textContent,
  };
}
