import { getById } from "./lib/client-misc.js";
import { makePromise } from "./lib/misc.js";
import { downloadZip } from "./zip.js";
console.log("hello world!");
const sampleCanvas = getById("sample", HTMLCanvasElement);
const context = sampleCanvas.getContext("2d");
context.ellipse(50, 50, 40, 30, 0, 0, 2 * Math.PI);
context.fillStyle = "red";
context.fill();
context.lineWidth = 3;
context.strokeStyle = "black";
context.stroke();
async function downloadTestZip() {
    const code = await fetch("https://raw.githubusercontent.com/Touffy/client-zip/master/src/index.ts");
    const intro = { name: "intro.txt", lastModified: new Date(), input: "Hello. This is the client-zip library." };
    const canvasBlob = makePromise();
    sampleCanvas.toBlob((blob) => {
        if (!blob) {
            canvasBlob.reject(new Error("blob is null!"));
        }
        else {
            canvasBlob.resolve(blob);
        }
    });
    const canvas = { name: "Brad.png", lastModified: new Date(), input: await canvasBlob.promise };
    const blob = await downloadZip([intro, code, canvas]).blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "test.zip";
    link.click();
    link.remove();
}
window.downloadTestZip = downloadTestZip;
//# sourceMappingURL=index.js.map