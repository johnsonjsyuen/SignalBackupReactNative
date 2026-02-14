import { File } from 'expo-file-system';

/**
 * Computes the MD5 hash of a file.
 *
 * Leverages the built-in `.md5` property on the expo-file-system v19 `File` class,
 * which returns the hex-encoded MD5 digest or null if the file cannot be read.
 */
export function computeFileMd5(fileUri: string): string {
  const file = new File(fileUri);
  const md5 = file.md5;
  if (!md5) {
    throw new Error(`Failed to compute MD5 for: ${fileUri}`);
  }
  return md5;
}
