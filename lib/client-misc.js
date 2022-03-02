export function getById(id, ty) {
    const found = document.getElementById(id);
    if (!found) {
        throw new Error("Could not find element with id " + id + ".  Expected type:  " + ty.name);
    }
    if (found instanceof ty) {
        return found;
    }
    else {
        throw new Error("Element with id " +
            id +
            " has type " +
            found.constructor.name +
            ".  Expected type:  " +
            ty.name);
    }
}
export function loadDateTimeLocal(input, dateAndTime, truncateTo = "milliseconds") {
    let truncateBy;
    switch (truncateTo) {
        case "minutes": {
            truncateBy = dateAndTime.getSeconds() * 1000 + dateAndTime.getMilliseconds();
            break;
        }
        case "seconds": {
            truncateBy = dateAndTime.getMilliseconds();
            break;
        }
        case "milliseconds": {
            truncateBy = 0;
            break;
        }
        default: {
            throw new Error("wtf");
        }
    }
    input.valueAsNumber = (+dateAndTime) - (dateAndTime.getTimezoneOffset() * 60000) - truncateBy;
}
//# sourceMappingURL=client-misc.js.map