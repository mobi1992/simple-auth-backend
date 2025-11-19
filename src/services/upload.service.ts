import { Dropbox } from 'dropbox';
import { Readable } from 'stream';
import { FileStreamResponse, FileLinkResponse, FileListItem } from '../types';

export class UploadService {
  private dbx: Dropbox;

  constructor(accessToken: string) {
    this.dbx = new Dropbox({ accessToken });
  }

  /**
   * Extracts the preview image URL from Dropbox shared link HTML
   */
  private async extractPreviewUrlFromHtml(sharedLink: string): Promise<string> {
    try {
      const response = await fetch(sharedLink);
      const html = await response.text();
      
      const previewUrlRegex = /https:\/\/[a-z0-9-]+\.previews\.dropboxusercontent\.com\/p\/thumb\/[A-Za-z0-9_\-]+\/[A-Za-z0-9_.-]+(?:\?[^"'\s<>]+)?/g;
      const matches = html.match(previewUrlRegex);
      
      if (matches && matches.length > 0) {
        let url = matches[0];
        
        if (url.includes('is_prewarmed=true')) {
          const firstEndIndex = url.indexOf('is_prewarmed=true') + 'is_prewarmed=true'.length;
          url = url.substring(0, firstEndIndex);
        }
        
        return url;
      }
      
      const base64Regex = /"([A-Za-z0-9+/=]{200,})"/g;
      const base64Matches = [...html.matchAll(base64Regex)];
      
      for (const base64Match of base64Matches) {
        try {
          const decoded = Buffer.from(base64Match[1], 'base64').toString('utf-8');
          const decodedMatches = decoded.match(previewUrlRegex);
          if (decodedMatches && decodedMatches.length > 0) {
            let url = decodedMatches[0];
            
            if (url.includes('is_prewarmed=true')) {
              const firstEndIndex = url.indexOf('is_prewarmed=true') + 'is_prewarmed=true'.length;
              url = url.substring(0, firstEndIndex);
            }
            
            return url;
          }
        } catch (e) {
          continue;
        }
      }
      
      return sharedLink;
    } catch (error) {
      console.error('Error extracting preview URL from HTML:', error);
      return sharedLink;
    }
  }

  async uploadFile(file: Express.Multer.File, path?: string): Promise<any> {
    const uploadPath = path || `/uploads/${file.originalname}`;
    const result = await this.dbx.filesUpload({
      path: uploadPath,
      contents: file.buffer,
    });

    const filePath = result.result.path_display || result.result.path_lower || '';
    let sharedLink: string;
    try {
      const linkResult: any = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: filePath,
      });
      sharedLink = linkResult.result.url;
    } catch (err: any) {
      if (err?.error?.error?.['.tag'] === 'shared_link_already_exists') {
        const existingLinks: any = await this.dbx.sharingListSharedLinks({
          path: filePath,
        });
        if (existingLinks.result.links && existingLinks.result.links.length > 0) {
          sharedLink = existingLinks.result.links[0].url;
        } else {
          throw new Error('Failed to get shared link');
        }
      } else {
        throw err;
      }
    }

    // Extract preview URL from HTML
    const previewUrl = await this.extractPreviewUrlFromHtml(sharedLink);

    return {
      ...result,
      sharedLink: previewUrl,
    };
  }

  async getFileStream(filePath: string): Promise<FileStreamResponse> {
    const linkResult: any = await this.dbx.filesGetTemporaryLink({
      path: filePath,
    });

    const metadataResult: any = await this.dbx.filesGetMetadata({
      path: filePath,
    });

    const response = await fetch(linkResult.result.link);
    
    if (!response.body) {
      throw new Error('Failed to get file stream');
    }

    const nodeStream = Readable.fromWeb(response.body as any);

    return {
      stream: nodeStream,
      metadata: {
        name: metadataResult.result.name,
        pathLower: metadataResult.result.path_lower,
        size: metadataResult.result.size,
      },
    };
  }

  async getFileLink(filePath: string): Promise<FileLinkResponse> {
    const metadataResult: any = await this.dbx.filesGetMetadata({
      path: filePath,
    });

    const existingLinks: any = await this.dbx.sharingListSharedLinks({
      path: filePath,
    });

    if (!existingLinks.result.links || existingLinks.result.links.length === 0) {
      throw new Error('No shared link found for this file. Please upload the file first.');
    }

    const sharedLink = existingLinks.result.links[0].url;
    
    // Extract preview URL from HTML
    const previewUrl = await this.extractPreviewUrlFromHtml(sharedLink);

    return {
      link: previewUrl,
      metadata: {
        name: metadataResult.result.name,
        pathLower: metadataResult.result.path_lower,
        size: metadataResult.result.size,
      },
    };
  }

  async listFiles(folderPath: string = '/uploads'): Promise<FileListItem[]> {
    const result: any = await this.dbx.filesListFolder({
      path: folderPath,
    });

    return result.result.entries.map((entry: any) => ({
      name: entry.name,
      path: entry.path_display || entry.path_lower,
      isFile: entry['.tag'] === 'file',
      size: entry.size || 0,
    }));
  }
}

