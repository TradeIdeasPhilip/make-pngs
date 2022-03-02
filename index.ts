import { getById } from "./lib/client-misc.js";
import { makePromise } from "./lib/misc.js";
import { downloadZip } from "./zip.js";

console.log("hello world!")

const sampleCanvas = getById("sample", HTMLCanvasElement);

const context = sampleCanvas.getContext("2d")!;
context.ellipse(50, 50, 40,30, 0, 0, 2*Math.PI);
context.fillStyle = "red";
context.fill();
context.lineWidth = 3;
context.strokeStyle = "black";
context.stroke();

async function downloadTestZip() {
  // define what we want in the ZIP
  const code = await fetch("https://raw.githubusercontent.com/Touffy/client-zip/master/src/index.ts")
  const intro = { name: "intro.txt", lastModified: new Date(), input: "Hello. This is the client-zip library." }

  const canvasBlob = makePromise<Blob>();
  sampleCanvas.toBlob((blob) => {
    if (!blob) {
      canvasBlob.reject(new Error("blob is null!"));
    } else{
      canvasBlob.resolve(blob);
    }
  });
  const canvas = {name: "Brad.png", lastModified : new Date(), input :await canvasBlob.promise};

  // get the ZIP stream in a Blob
  const blob = await downloadZip([intro, code, canvas]).blob()

  // make and click a temporary link to download the Blob
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "test.zip"
  link.click()
  link.remove()

// in real life, don't forget to revoke your Blob URLs if you use them
}

(window as any).downloadTestZip = downloadTestZip;