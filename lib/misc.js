export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function testXml(xmlStr) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(xmlStr, "application/xml");
    for (const element of Array.from(dom.querySelectorAll("parsererror"))) {
        if (element instanceof HTMLElement) {
            return { error: element };
        }
    }
    return { parsed: dom };
}
export function pickAny(set) {
    const first = set.values().next();
    if (first.done) {
        return undefined;
    }
    else {
        return first.value;
    }
}
export function pick(array) {
    return array[(Math.random() * array.length) | 0];
}
export function filterMap(input, transform) {
    const result = [];
    input.forEach((input, index) => {
        const possibleElement = transform(input, index);
        if (undefined !== possibleElement) {
            result.push(possibleElement);
        }
    });
    return result;
}
export function makePromise() {
    let resolve;
    let reject;
    const promise = new Promise((resolve1, reject1) => {
        resolve = resolve1;
        reject = reject1;
    });
    return { promise, resolve, reject };
}
export const MAX_DATE = new Date(8640000000000000);
export const MIN_DATE = new Date(-8640000000000000);
export function dateIsValid(date) {
    return isFinite(date.getTime());
}
export const NON_BREAKING_SPACE = "\xa0";
//# sourceMappingURL=misc.js.map