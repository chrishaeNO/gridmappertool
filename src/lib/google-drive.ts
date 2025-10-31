'use client';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleDriveFolder extends GoogleDriveFile {
  mimeType: 'application/vnd.google-apps.folder';
}

export class GoogleDriveService {
  private accessToken: string;
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private uploadUrl = 'https://www.googleapis.com/upload/drive/v3';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getFolders(parentId?: string): Promise<GoogleDriveFolder[]> {
    const query = parentId 
      ? `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      : `mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

    const url = `${this.baseUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents,createdTime,modifiedTime)&orderBy=name`;
    
    const response = await this.makeRequest(url);
    return response.files || [];
  }

  async createFolder(name: string, parentId?: string): Promise<GoogleDriveFolder> {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : ['root'],
    };

    const response = await this.makeRequest(`${this.baseUrl}/files`, {
      method: 'POST',
      body: JSON.stringify(metadata),
    });

    return response;
  }

  async uploadFile(
    fileName: string, 
    fileBlob: Blob, 
    parentId?: string,
    mimeType: string = 'image/png'
  ): Promise<GoogleDriveFile> {
    // Create file metadata
    const metadata = {
      name: fileName,
      parents: parentId ? [parentId] : ['root'],
    };

    // Use multipart upload for files with metadata
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadataBody = delimiter + 
      'Content-Type: application/json\r\n\r\n' + 
      JSON.stringify(metadata);

    const fileBody = delimiter + 
      `Content-Type: ${mimeType}\r\n\r\n`;

    // Convert blob to array buffer
    const fileData = await fileBlob.arrayBuffer();
    
    // Create the multipart body
    const bodyParts = [
      new TextEncoder().encode(metadataBody),
      new TextEncoder().encode(fileBody),
      new Uint8Array(fileData),
      new TextEncoder().encode(close_delim)
    ];

    // Calculate total length
    const totalLength = bodyParts.reduce((sum, part) => sum + part.length, 0);
    
    // Combine all parts
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of bodyParts) {
      body.set(part, offset);
      offset += part.length;
    }

    const response = await fetch(`${this.uploadUrl}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive upload error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getFileInfo(fileId: string): Promise<GoogleDriveFile> {
    const url = `${this.baseUrl}/files/${fileId}?fields=id,name,mimeType,parents,webViewLink,webContentLink,createdTime,modifiedTime,size`;
    return this.makeRequest(url);
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.makeRequest(`${this.baseUrl}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async searchFiles(query: string): Promise<GoogleDriveFile[]> {
    const url = `${this.baseUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size)`;
    const response = await this.makeRequest(url);
    return response.files || [];
  }

  async getFolderPath(folderId: string): Promise<string[]> {
    const path: string[] = [];
    let currentId = folderId;

    while (currentId && currentId !== 'root') {
      try {
        const folder = await this.getFileInfo(currentId);
        path.unshift(folder.name);
        
        if (folder.parents && folder.parents.length > 0) {
          currentId = folder.parents[0];
        } else {
          break;
        }
      } catch (error) {
        console.error('Error getting folder path:', error);
        break;
      }
    }

    return path;
  }
}
