import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Custom authentication provider for Microsoft Graph
class CustomAuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export interface OneDriveItem {
  id: string;
  name: string;
  webUrl: string;
  folder?: {
    childCount: number;
  };
  file?: {
    mimeType: string;
  };
  parentReference?: {
    driveId: string;
    id: string;
    path: string;
  };
}

export interface OneDriveUploadResult {
  id: string;
  name: string;
  webUrl: string;
  downloadUrl: string;
}

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    const authProvider = new CustomAuthProvider(accessToken);
    this.client = Client.initWithMiddleware({ authProvider });
  }

  // Get user's OneDrive root folders
  async getOneDriveFolders(folderId?: string): Promise<OneDriveItem[]> {
    try {
      const endpoint = folderId 
        ? `/me/drive/items/${folderId}/children`
        : '/me/drive/root/children';
      
      const response = await this.client
        .api(endpoint)
        .filter('folder ne null')
        .select('id,name,webUrl,folder,parentReference')
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Error fetching OneDrive folders:', error);
      throw new Error('Failed to fetch OneDrive folders');
    }
  }

  // Create a folder in OneDrive
  async createFolder(name: string, parentId?: string): Promise<OneDriveItem> {
    try {
      const endpoint = parentId 
        ? `/me/drive/items/${parentId}/children`
        : '/me/drive/root/children';

      const folderData = {
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      };

      const response = await this.client
        .api(endpoint)
        .post(folderData);

      return response;
    } catch (error) {
      console.error('Error creating OneDrive folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  // Upload file to OneDrive
  async uploadFile(
    fileName: string, 
    fileContent: Blob, 
    folderId?: string
  ): Promise<OneDriveUploadResult> {
    try {
      const endpoint = folderId 
        ? `/me/drive/items/${folderId}:/${fileName}:/content`
        : `/me/drive/root:/${fileName}:/content`;

      const response = await this.client
        .api(endpoint)
        .putStream(fileContent);

      return {
        id: response.id,
        name: response.name,
        webUrl: response.webUrl,
        downloadUrl: response['@microsoft.graph.downloadUrl']
      };
    } catch (error) {
      console.error('Error uploading to OneDrive:', error);
      throw new Error('Failed to upload file to OneDrive');
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const user = await this.client
        .api('/me')
        .select('displayName,mail,userPrincipalName')
        .get();
      
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Share file with Teams
  async shareWithTeams(itemId: string, teamId?: string) {
    try {
      const shareLink = await this.client
        .api(`/me/drive/items/${itemId}/createLink`)
        .post({
          type: 'view',
          scope: 'organization'
        });

      return shareLink;
    } catch (error) {
      console.error('Error sharing with Teams:', error);
      throw new Error('Failed to share with Teams');
    }
  }

  // Get user's Teams
  async getUserTeams() {
    try {
      const teams = await this.client
        .api('/me/joinedTeams')
        .select('id,displayName,description')
        .get();

      return teams.value || [];
    } catch (error) {
      console.error('Error fetching Teams:', error);
      throw new Error('Failed to fetch Teams');
    }
  }

  // Post message to Teams channel
  async postToTeamsChannel(
    teamId: string, 
    channelId: string, 
    message: string, 
    attachments?: any[]
  ) {
    try {
      const chatMessage = {
        body: {
          content: message,
          contentType: 'html'
        },
        attachments: attachments || []
      };

      const response = await this.client
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post(chatMessage);

      return response;
    } catch (error) {
      console.error('Error posting to Teams:', error);
      throw new Error('Failed to post to Teams channel');
    }
  }
}
