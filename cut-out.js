import { getBlobFromCanvas, getById } from "./lib/client-misc.js";
import { sleep } from "./lib/misc.js";
import { downloadZip } from "./zip.js";
const initialImg = getById("initialImg", HTMLImageElement);
const canvas = getById("canvas", HTMLCanvasElement);
const finalImg = getById("finalImg", HTMLImageElement);
const context = canvas.getContext("2d");
document.body.addEventListener("drop", (ev) => {
    ev.preventDefault();
    const files = [];
    if (!ev.dataTransfer) {
        throw new Error("wtf");
    }
    else if (ev.dataTransfer.items) {
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            if (ev.dataTransfer.items[i].kind === "file") {
                const file = ev.dataTransfer.items[i].getAsFile();
                if (!file) {
                    console.log("⁇?", i, ev.dataTransfer.items[i]);
                }
                else {
                    files.push(file);
                }
            }
        }
    }
    else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        }
    }
    processFiles(files);
});
async function processFiles(files) {
    switch (files.length) {
        case 0: {
            console.log("processFiles([])");
            break;
        }
        case 1: {
            const file = files[0];
            try {
                saveFile(file.name, await processFile(file));
            }
            catch (reason) {
                console.error(reason, file);
            }
            break;
        }
        default: {
            async function* toSave() {
                const fileNames = new Set();
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
                    }
                    catch (reason) {
                        console.error(reason, file);
                    }
                }
                let index = `<html><head><style>
        body {
        background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
        linear-gradient(-45deg, #808080 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #808080 75%),
        linear-gradient(-45deg, transparent 75%, #808080 75%);
        background-attachment: fixed;
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }</style></head><body>`;
                fileNames.forEach((fileName) => {
                    sanitizer.innerText = fileName;
                    fileName = sanitizer.innerHTML;
                    index += `<img src="${fileName}" title="${fileName}"> `;
                });
                index += `</body><html>`;
                yield {
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
async function processFile(file) {
    const url = URL.createObjectURL(file);
    try {
        initialImg.src = url;
        await initialImg.decode();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#ffffff";
        context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, 2 * Math.PI);
        context.fill();
        context.globalCompositeOperation = "source-in";
        context.drawImage(initialImg, 0, 0);
    }
    finally {
        URL.revokeObjectURL(url);
        context.globalCompositeOperation = "source-over";
    }
    showSampleSoon();
    return getBlobFromCanvas(canvas);
}
let sampleIsPending = false;
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
    }
    catch (reason) {
        console.error(reason);
    }
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
document.body.addEventListener("dragover", (ev) => {
    ev.preventDefault();
});
//# sourceMappingURL=cut-out.js.map