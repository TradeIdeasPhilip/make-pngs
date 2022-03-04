import { getBlobFromCanvas, getById } from "./lib/client-misc.js";
import { sleep } from "./lib/misc.js";
import { downloadZip } from "./zip.js";
const initialImg = getById("initialImg", HTMLImageElement);
const canvas = getById("canvas", HTMLCanvasElement);
const finalImg = getById("finalImg", HTMLImageElement);
const context = canvas.getContext("2d");
context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, 2 * Math.PI);
context.clip();
function dropHandler(ev) {
    console.log("File(s) dropped");
    ev.preventDefault();
    const files = [];
    if (!ev.dataTransfer) {
        throw new Error("wtf");
    }
    else if (ev.dataTransfer.items) {
        console.log("Use DataTransferItemList interface to access the file(s)");
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            if (ev.dataTransfer.items[i].kind === "file") {
                const file = ev.dataTransfer.items[i].getAsFile();
                if (!file) {
                    console.log("⁇?", i, ev.dataTransfer.items[i]);
                }
                else {
                    console.log("... file[" + i + "].name = " + file.name);
                    files.push(file);
                }
            }
        }
    }
    else {
        console.log("Use DataTransfer interface to access the file(s)");
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log("... file[" + i + "].name = " + ev.dataTransfer.files[i].name);
        }
    }
    processFiles(files);
}
async function processFiles(files) {
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
            async function* toSave() {
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
async function processFile(file) {
    const url = URL.createObjectURL(file);
    try {
        initialImg.src = url;
        await sleep(1000);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(initialImg, 0, 0);
    }
    finally {
        URL.revokeObjectURL(url);
    }
    showSampleSoon();
    return getBlobFromCanvas(canvas);
}
let sampleIsPending = false;
async function showSampleSoon() {
    if (sampleIsPending) {
        return;
    }
    sampleIsPending = true;
    await sleep(10);
    sampleIsPending = false;
    const url = URL.createObjectURL(await getBlobFromCanvas(canvas));
    finalImg.src = url;
    await sleep(10);
    URL.revokeObjectURL(url);
}
function saveFile(name, contents) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(contents);
    link.href = url;
    link.download = name;
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
function dragOverHandler(ev) {
    console.log("File(s) in drop zone");
    ev.preventDefault();
}
window.dropHandler = dropHandler;
window.dragOverHandler = dragOverHandler;
//# sourceMappingURL=cut-out.js.map