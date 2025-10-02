// Mock implementation for react-native-fs

export const DocumentDirectoryPath = '/mock/documents';

export const exists = async (path: string): Promise<boolean> => {
  // Mock file existence check
  return Promise.resolve(Math.random() > 0.5);
};

export const mkdir = async (path: string): Promise<void> => {
  console.log(`Mock: Creating directory ${path}`);
  return Promise.resolve();
};

export const unlink = async (path: string): Promise<void> => {
  console.log(`Mock: Deleting ${path}`);
  return Promise.resolve();
};

export const readDir = async (path: string): Promise<Array<{ name: string; path: string; size: number; isFile: () => boolean; isDirectory: () => boolean }>> => {
  // Mock directory listing
  return Promise.resolve([
    {
      name: 'mock_file.png',
      path: `${path}/mock_file.png`,
      size: 1024,
      isFile: () => true,
      isDirectory: () => false,
    },
  ]);
};

export const downloadFile = (options: { fromUrl: string; toFile: string }) => {
  return {
    promise: Promise.resolve({ statusCode: 200 }),
  };
};

export default {
  DocumentDirectoryPath,
  exists,
  mkdir,
  unlink,
  readDir,
  downloadFile,
};