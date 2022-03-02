import { getById } from "./lib/client-misc.js";
import { filterMap, makePromise } from "./lib/misc.js";
import { downloadZip } from "./zip.js";

console.log("hello world!");

const widthInPixelsInput = getById("widthInPixels", HTMLInputElement);
const heightInPixelsInput = getById("heightInPixels", HTMLInputElement);
const textColorInput = getById("textColorInput", HTMLInputElement);
const backgroundColorInput = getById("backgroundColorInput", HTMLInputElement);
const fontInput = getById("fontInput", HTMLInputElement);

const sampleCanvas = getById("sample", HTMLCanvasElement);
const context = sampleCanvas.getContext("2d")!;

function drawSymbol(symbol: string) {
  const desiredWidth = parseInt(widthInPixelsInput.value);
  const desiredHeight = parseInt(heightInPixelsInput.value);
  sampleCanvas.width = desiredWidth;
  sampleCanvas.height = desiredHeight;
  context.fillStyle = backgroundColorInput.value;
  context.fillRect(0, 0, desiredWidth, desiredHeight);
  context.font = fontInput.value;
  context.fillStyle = textColorInput.value;
  const size = context.measureText(symbol);
  console.log(size);
  const textWidth = size.width;
  const textHeight = size.actualBoundingBoxAscent;
  context.fillText(
    symbol,
    (desiredWidth - textWidth) / 2,
    (desiredHeight + textHeight) / 2
  );
}

let sampleText = "!@#%🗲%^&";

function drawSampleText() {
  drawSymbol(sampleText);
}

[
  widthInPixelsInput,
  heightInPixelsInput,
  textColorInput,
  backgroundColorInput,
  fontInput,
].forEach((input) => {
  input.addEventListener("input", () => drawSampleText());
});

const nextSampleButton = getById("nextSample", HTMLButtonElement);
const previousSampleButton = getById("previousSample", HTMLButtonElement);
const saveAllButton = getById("saveAll", HTMLButtonElement);
const symbolsTextArea = getById("symbols", HTMLTextAreaElement);

function getSamples(): string[] {
  return filterMap(symbolsTextArea.value.split(/(\n|\r)+/g), (line) => {
    const trimmed = line.trim();
    if (trimmed == "") {
      return undefined;
    } else {
      return trimmed;
    }
  });
}

function updateSamples(direction: number) {
  const samples = getSamples();
  if (samples.length == 0) {
    sampleText = "$*?!";
  } else {
    const currentIndex = samples.indexOf(sampleText);
    if (currentIndex < 0) {
      // Not found!  Jump to the first item.
      sampleText = samples[0];
    } else {
      const newIndex =
        (currentIndex + direction + samples.length) % samples.length;
      sampleText = samples[newIndex];
    }
  }
  drawSampleText();
}

nextSampleButton.addEventListener("click", () => {
  updateSamples(1);
});

previousSampleButton.addEventListener("click", () => {
  updateSamples(-1);
});

updateSamples(0);

/*
context.ellipse(50, 50, 40, 30, 0, 0, 2 * Math.PI);
context.fillStyle = "red";
context.fill();
context.lineWidth = 3;
context.strokeStyle = "black";
context.stroke();
console.log(context.font);
context.fillStyle="blue";
context.fillText("MSFT", 50, 10);
*/

async function downloadTestZip() {
  // define what we want in the ZIP
  const code = await fetch(
    "https://raw.githubusercontent.com/Touffy/client-zip/master/src/index.ts"
  );
  const intro = {
    name: "intro.txt",
    lastModified: new Date(),
    input: "Hello. This is the client-zip library.",
  };

  const canvasBlob = makePromise<Blob>();
  sampleCanvas.toBlob((blob) => {
    if (!blob) {
      canvasBlob.reject(new Error("blob is null!"));
    } else {
      canvasBlob.resolve(blob);
    }
  });
  const canvas = {
    name: "Brad.png",
    lastModified: new Date(),
    input: await canvasBlob.promise,
  };

  // get the ZIP stream in a Blob
  const blob = await downloadZip([intro, code, canvas]).blob();

  // make and click a temporary link to download the Blob
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "test.zip";
  link.click();
  link.remove();

  // in real life, don't forget to revoke your Blob URLs if you use them
}

(window as any).downloadTestZip = downloadTestZip;
