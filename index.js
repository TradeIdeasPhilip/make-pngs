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
const context = sampleCanvas.getContext("2d");
function drawSymbol(symbol) {
    const desiredWidth = parseInt(widthInPixelsInput.value);
    const desiredHeight = parseInt(heightInPixelsInput.value);
    sampleCanvas.width = desiredWidth;
    sampleCanvas.height = desiredHeight;
    context.fillStyle = backgroundColorInput.value;
    const backgroundType = backgroundTypeSelect[backgroundTypeSelect.selectedIndex].innerText;
    switch (backgroundType) {
        case "Rectangle": {
            context.fillRect(0, 0, desiredWidth, desiredHeight);
            break;
        }
        case "Oval": {
            context.beginPath();
            context.ellipse(desiredWidth / 2, desiredHeight / 2, desiredWidth / 2, desiredHeight / 2, 0, 0, 2 * Math.PI);
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
    const textWidth = size.width;
    const textHeight = size.actualBoundingBoxAscent;
    context.fillText(symbol, (desiredWidth - textWidth) / 2, (desiredHeight + textHeight) / 2);
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
    backgroundTypeSelect,
    fontInput,
].forEach((input) => {
    input.addEventListener("input", () => drawSampleText());
});
const nextSampleButton = getById("nextSample", HTMLButtonElement);
const previousSampleButton = getById("previousSample", HTMLButtonElement);
const saveAllButton = getById("saveAll", HTMLButtonElement);
const symbolsTextArea = getById("symbols", HTMLTextAreaElement);
function getSamples() {
    return filterMap(symbolsTextArea.value.split(/(\n|\r)+/g), (line) => {
        const trimmed = line.trim();
        if (trimmed == "") {
            return undefined;
        }
        else {
            return trimmed;
        }
    });
}
function updateSamples(direction) {
    const samples = getSamples();
    if (samples.length == 0) {
        sampleText = "$*?!";
    }
    else {
        const currentIndex = samples.indexOf(sampleText);
        if (currentIndex < 0) {
            sampleText = samples[0];
        }
        else {
            const newIndex = (currentIndex + direction + samples.length) % samples.length;
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
saveAllButton.addEventListener("click", async () => {
    async function* images() {
        const samples = getSamples();
        for (const symbol of samples) {
            drawSymbol(symbol);
            const canvasBlob = makePromise();
            sampleCanvas.toBlob((blob) => {
                if (!blob) {
                    canvasBlob.reject(new Error("blob is null!"));
                }
                else {
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
    const blob = await downloadZip(images()).blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "all_png_files.zip";
    link.click();
    link.remove();
    updateSamples(0);
});
//# sourceMappingURL=index.js.map