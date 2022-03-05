import { getBlobFromCanvas, getById } from "./lib/client-misc.js";
import { sleep } from "./lib/misc.js";
import { downloadZip } from "./zip.js";

const initialImg = getById("initialImg", HTMLImageElement);
const canvas = getById("canvas", HTMLCanvasElement);
const finalImg = getById("finalImg", HTMLImageElement);
const context = canvas.getContext("2d")!;

document.body.addEventListener("drop", (ev: DragEvent) => {
  // Inspired by https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop.

  //console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  const files: File[] = [];
  if (!ev.dataTransfer) {
    throw new Error("wtf");
  } else if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    //console.log("Use DataTransferItemList interface to access the file(s)");
    // On my system I only see this branch of the if.
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
          //console.log("... file[" + i + "].name = " + file.name);
          files.push(file);
        }
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    //console.log("Use DataTransfer interface to access the file(s)");
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      //console.log(
      //  "... file[" + i + "].name = " + ev.dataTransfer.files[i].name
      //);
    }
  }

  processFiles(files);
});

async function processFiles(files: File[]) {
  switch (files.length) {
    case 0: {
      // Not strictly an error, but I wouldn't expect to see this.
      // Seeing this message suggests that we got the right message, but we had trouble decoding it.
      console.log("processFiles([])");
      break;
    }
    case 1: {
      const file = files[0];
      try {
        saveFile(file.name, await processFile(file));
      } catch (reason) {
        console.error(reason, file);
      }
      break;
    }
    default: {
      async function* toSave(): AsyncGenerator<
        {
          name: string;
          lastModified: Date;
          input: Blob | string;
        },
        void,
        unknown
      > {
        const fileNames = new Set<string>();
        const sanitizer = document.createElement("span");
        for (const file of files) {
          try {
            const blob = await processFile(file);
            fileNames.add(file.name);
            yield {
              name: file.name,
              lastModified: new Date(),
              input: blob,
            };
          } catch (reason) {
            console.error(reason, file);
            /* Sample output:
            cut-out.ts:89 DOMException: The source image cannot be decoded. File {name: 'debug.log', lastModified: 1646345226958, lastModifiedDate: Thu Mar 03 2022 14:07:06 GMT-0800 (Pacific Standard Time), webkitRelativePath: '', size: 6249, …}
toSave @ cut-out.ts:89
cut-out.ts:89 DOMException: The source image cannot be decoded. File {name: 'icons.psd', lastModified: 1646345270705, lastModifiedDate: Thu Mar 03 2022 14:07:50 GMT-0800 (Pacific Standard Time), webkitRelativePath: '', size: 5140939, …}
            */
          }
        }
        let index = `<html><head><style>
        body {
        background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
        linear-gradient(-45deg, #808080 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #808080 75%),
        linear-gradient(-45deg, transparent 75%, #808080 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }</style></head><body>`;
        fileNames.forEach((fileName) => {
          sanitizer.innerText = fileName;
          fileName = sanitizer.innerHTML;
          index += `<img src="${fileName}" title="${fileName}"> `;
        });
        index += `</body><html>`;
        yield  {
          name: "index.html",
          lastModified: new Date(),
          input: index,
        };

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
    await initialImg.decode();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.ellipse(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2,
      canvas.height / 2,
      0,
      0,
      2 * Math.PI
    );
    context.fill();
    context.globalCompositeOperation = "source-in";
    context.drawImage(initialImg, 0, 0);
  } finally {
    URL.revokeObjectURL(url);
    context.globalCompositeOperation = "source-over";
  }
  showSampleSoon();
  return getBlobFromCanvas(canvas);
}

let sampleIsPending = false;
/**
 * Schedules the sample window to be updated soon.
 * If we are processing in batch mode, don't bother to update the sample every time.
 *
 * The sample is an <img>.  At the moment the <img> is an exact copy of the <canvas>
 * where we created the image.  I saw some strange artifacts around the clipping area,
 * and I wanted to know if the artifacts would still appear after the image left the
 * canvas.  In fact, the artifacts are still there.
 * @returns Nothing.
 */
async function showSampleSoon() {
  try {
    if (sampleIsPending) {
      return;
    }
    sampleIsPending = true;
    await sleep(1000);
    sampleIsPending = false;
    const url = URL.createObjectURL(await getBlobFromCanvas(canvas));
    finalImg.src = url;
    await finalImg.decode();
    URL.revokeObjectURL(url);
  } catch (reason) {
    console.error(reason);
  }
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

document.body.addEventListener("dragover", (ev: DragEvent) => {
  //console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
});
