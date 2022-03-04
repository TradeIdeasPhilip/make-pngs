function dropHandler(ev) {
    console.log("File(s) dropped");
    ev.preventDefault();
    if (!ev.dataTransfer) {
        throw new Error("wtf");
    }
    else if (ev.dataTransfer.items) {
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            if (ev.dataTransfer.items[i].kind === "file") {
                var file = ev.dataTransfer.items[i].getAsFile();
                console.log("... file[" + i + "].name = " + file?.name);
            }
        }
    }
    else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log("... file[" + i + "].name = " + ev.dataTransfer.files[i].name);
        }
    }
}
function dragOverHandler(ev) {
    console.log("File(s) in drop zone");
    ev.preventDefault();
}
window.dropHandler = dropHandler;
window.dragOverHandler = dragOverHandler;
export {};
//# sourceMappingURL=cut-out.js.map