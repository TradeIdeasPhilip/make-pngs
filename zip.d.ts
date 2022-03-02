type ForAwaitable<T> = Iterable<T> | AsyncIterable<T>;
// input could also be "some kind of ArrayView".  TODO add this.
type InputTypes =
  | Response
  | File
  | {
      name: string;
      lastModified: Date;
      input:
        | File
        | Blob
        | Response
        | ArrayBuffer
        | ReadableStream<Uint8Array>
        | AsyncIterable<ArrayBuffer | ArrayView | string>
        | string;
    };
export function downloadZip(files: ForAwaitable<InputTypes>): Response;

// https://github.com/Touffy/client-zip

// Perhaps https://github.com/Touffy/client-zip/blob/master/index.d.ts is what I'm trying to duplicate here.
// I wonder why "name" and "lastModified" are declared as any in that file.
