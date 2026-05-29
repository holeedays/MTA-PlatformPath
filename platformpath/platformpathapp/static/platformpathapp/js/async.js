async function getDOMElement(id, waitTimeMS) {

    while (document.getElementById(id) === null) {
        await new Promise((res)=> {setTimeout(res, waitTimeMS)});
    }

    console.log("Success!");
    return document.getElementById(id);
}