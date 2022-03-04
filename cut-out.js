import { getById } from "./lib/client-misc.js";
import { downloadZip } from "./zip.js";
const img = getById("img", HTMLImageElement);
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
    return file;
    return undefined;
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