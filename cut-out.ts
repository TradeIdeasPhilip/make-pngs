export {};

/**
 * Inspired by https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop.
 * @param ev
 */
function dropHandler(ev: DragEvent) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (!ev.dataTransfer) {
    throw new Error("wtf");
  } else if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === "file") {
        var file = ev.dataTransfer.items[i].getAsFile();
        console.log("... file[" + i + "].name = " + file?.name);
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log(
        "... file[" + i + "].name = " + ev.dataTransfer.files[i].name
      );
    }
  }
}

function dragOverHandler(ev: DragEvent) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

(window as any).dropHandler = dropHandler;
(window as any).dragOverHandler = dragOverHandler;
