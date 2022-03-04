import { getById } from "./lib/client-misc.js";
import { filterMap, makePromise } from "./lib/misc.js";
import { downloadZip } from "./zip.js";

const widthInPixelsInput = getById("widthInPixels", HTMLInputElement);
const heightInPixelsInput = getById("heightInPixels", HTMLInputElement);
const textColorInput = getById("textColorInput", HTMLInputElement);
const backgroundColorInput = getById("backgroundColorInput", HTMLInputElement);
const backgroundTypeSelect = getById("backgroundType", HTMLSelectElement);
const fontInput = getById("fontInput", HTMLInputElement);

const sampleCanvas = getById("sample", HTMLCanvasElement);
const context = sampleCanvas.getContext("2d")!;

/**
 * Clear the sampleCanvas and draw ghe given symbol.
 * Use the inputs on the HTML page to configure the result.
 * @param symbol The symbol to draw.
 */
function drawSymbol(symbol: string) {
  const desiredWidth = parseInt(widthInPixelsInput.value);
  const desiredHeight = parseInt(heightInPixelsInput.value);
  sampleCanvas.width = desiredWidth;
  sampleCanvas.height = desiredHeight;
  context.fillStyle = backgroundColorInput.value;
  const backgroundType =
    backgroundTypeSelect[backgroundTypeSelect.selectedIndex].innerText;
  switch (backgroundType) {
    case "Rectangle": {
      context.fillRect(0, 0, desiredWidth, desiredHeight);
      break;
    }
    case "Oval": {
      context.beginPath();
      context.ellipse(
        desiredWidth / 2,
        desiredHeight / 2,
        desiredWidth / 2,
        desiredHeight / 2,
        0,
        0,
        2 * Math.PI
      );
      context.fill();
      break;
    }
    case "None": {
      break;
    }
    default: {
      const reason = new Error("wtf");
      console.error({ reason, backgroundType, backgroundTypeSelect });
      throw reason;
    }
  }
  context.font = fontInput.value;
  context.fillStyle = textColorInput.value;
  const size = context.measureText(symbol);
  //console.log(size);
  const textWidth = size.width;
  const textHeight = size.actualBoundingBoxAscent;
  context.fillText(
    symbol,
    (desiredWidth - textWidth) / 2,
    (desiredHeight + textHeight) / 2
  );
}

/**
 * The sample we are currently displaying.
 * I initialize this to garbage, so the first call to `updateSamples()` will replace this with a real value.
 */
let sampleText = "!@#%🗲%^&";

/**
 * Draw the currently selected sample.
 */
function drawSampleText() {
  drawSymbol(sampleText);
}

[
  widthInPixelsInput,
  heightInPixelsInput,
  textColorInput,
  backgroundColorInput,
  backgroundTypeSelect,
  fontInput,
].forEach((input) => {
  input.addEventListener("input", () => drawSampleText());
});

const nextSampleButton = getById("nextSample", HTMLButtonElement);
const previousSampleButton = getById("previousSample", HTMLButtonElement);
const saveAllButton = getById("saveAll", HTMLButtonElement);
const symbolsTextArea = getById("symbols", HTMLTextAreaElement);

/**
 * "Samples" refers to the samples that we might display on the screen to see the font and other settings are correct.
 * However, we use this same list to do the actual work, so "samples" might not be the best name.
 * @returns An array of all of the symbols the user entered in the GUI.
 * Blank lines and leading and trailing whitespace are automatically removed.
 */
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

/**
 * Try to move `direction` steps forward in the list of samples.
 *
 * Note that we save the value of the sample we are displaying, not the index.
 * Assume the list contains A, B, C, D, and E, in that order, and we ae currently displaying C.
 * Assume someone changes the list to be "A, Z1, Z2, B, C, Z3, Z4, Z5, E".
 * `updateSamples(0)` will make no change, `updateSamples(1)` will display Z3 and `updateSamples(-1)` will display B.
 *
 * Assume the list contains A, B, C, D, and E, in that order, and we ae currently displaying C.
 * Assume someone changes the list to be "A, B, D, E".
 * `updateSamples(anything)` will not find C and will always display A, the first item in the list.
 *
 * If the list is empty we display a built in default.  The default is not a valid stock symbol so it won't get
 * mixed up with real data on a future call to `updateSamples()`.
 * @param direction How much to move.  +1 will move to the next item.  -1 will move to the previous item.
 *
 * 0 will do any necessary cleanup, like checking if the currently selected item is valid.  IF the current item is valid, nothing changes.
 */
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
  // Show the next sample from the list.
  updateSamples(1);
});

previousSampleButton.addEventListener("click", () => {
  // Show the previous sample from the list.
  updateSamples(-1);
});

// Show something from the list.  This will initialize the page into a reasonable state.
updateSamples(0);

// This is the main point of the program!
// Everything else is just configuration and testing.
// Draw a PNG file for each stock symbol, pack them all in a zip file, and save that file.
saveAllButton.addEventListener("click", async () => {
  /**
   * Build images for each of the stock symbols.  Yield one at a time.
   * Yield the meta data and the data.
   */
  async function* images() {
    const samples = getSamples();
    for (const symbol of samples) {
      drawSymbol(symbol);
      const canvasBlob = makePromise<Blob>();
      sampleCanvas.toBlob((blob) => {
        if (!blob) {
          canvasBlob.reject(new Error("blob is null!"));
        } else {
          canvasBlob.resolve(blob);
        }
      });
      yield {
        name: symbol + ".png",
        lastModified: new Date(),
        input: await canvasBlob.promise,
      };
    }
  }

  // get the ZIP stream in a Blob
  const blob = await downloadZip(images()).blob();

  // make and click a temporary link to download the Blob
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "all_png_files.zip";
  link.click();
  link.remove();
  // TODO Clean up after the createObjectURL().

  // Put the GUI back into some consistent state.
  // This program uses the same canvas for the samples and for the real work.
  updateSamples(0);
});

function initBackgroundAnimation() {
  const backgroundForSample = getById("backgroundForSample", HTMLSpanElement);
  const style = backgroundForSample.style;

  function scheduleNextAnimation() {
    requestAnimationFrame(doAnimation);
  }
  function doAnimation(timestamp: number) {
    const baseTime = timestamp / 10000;
    style.setProperty("--rotation", baseTime + "turn");
    scheduleNextAnimation();
  }
  scheduleNextAnimation();
}
initBackgroundAnimation();
