import { getBlobFromCanvas, getById } from "./lib/client-misc.js";
import { sleep } from "./lib/misc.js";
import { downloadZip } from "./zip.js";

const initialImg = getById("initialImg", HTMLImageElement);
const canvas = getById("canvas", HTMLCanvasElement);
const finalImg = getById("finalImg", HTMLImageElement);
const context = canvas.getContext("2d")!;

context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, 2*Math.PI);
context.clip();

/**
 * Inspired by https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop.
 * @param ev
 */
function dropHandler(ev: DragEvent) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  const files: File[] = [];
  if (!ev.dataTransfer) {
    throw new Error("wtf");
  } else if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    console.log("Use DataTransferItemList interface to access the file(s)");
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === "file") {
        const file = ev.dataTransfer.items[i].getAsFile();
        if (!file) {
          console.log("⁇?", i, ev.dataTransfer.items[i]);
          // TODO Research this.  Is it an error or something I should silently ignore?
          // The example I copied this from ignored the possibility of getting a null here.
          // I had to add this if statement to satisfy TypeScript.
        } else {
          console.log("... file[" + i + "].name = " + file.name);
          files.push(file);
        }
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    console.log("Use DataTransfer interface to access the file(s)");
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log(
        "... file[" + i + "].name = " + ev.dataTransfer.files[i].name
      );
    }
  }

  processFiles(files);
}

async function processFiles(files: File[]) {
  switch (files.length) {
    case 0: {
      console.log("processFiles([])");
      break;
    }
    case 1: {
      const file = files[0];
      saveFile(file.name, await processFile(file));
      break;
    }
    default: {
      async function* toSave(): AsyncGenerator<
        {
          name: string;
          lastModified: Date;
          input: Blob;
        },
        void,
        unknown
      > {
        for (const file of files) {
          yield {
            name: file.name,
            lastModified: new Date(),
            input: await processFile(file),
          };
        }
      }
      const fileName = `converted ${files.length} images.zip`;
      saveFile(fileName, await downloadZip(toSave()).blob());
    }
  }
}

async function processFile(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    initialImg.src = url;
    await sleep(1000);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(initialImg, 0, 0);
  } finally {
    URL.revokeObjectURL(url);
  }
  // TODO Copy the result into the second <img>.
  return getBlobFromCanvas(canvas);
}

function saveFile(name: string, contents: Blob) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(contents);
  link.href = url;
  link.download = name;
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dragOverHandler(ev: DragEvent) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

(window as any).dropHandler = dropHandler;
(window as any).dragOverHandler = dragOverHandler;
