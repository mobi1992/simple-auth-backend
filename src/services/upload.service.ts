import { Dropbox } from 'dropbox';
import { Readable } from 'stream';
import { FileStreamResponse, FileLinkResponse, FileListItem } from '../types';

export class UploadService {
  private dbx: Dropbox;

  constructor(accessToken: string) {
    this.dbx = new Dropbox({ accessToken });
  }

  async uploadFile(file: Express.Multer.File, path?: string): Promise<any> {
    const uploadPath = path || `/uploads/${file.originalname}`;
    const result = await this.dbx.filesUpload({
      path: uploadPath,
      contents: file.buffer,
    });

    return result;
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

    return {
      link: sharedLink,
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

