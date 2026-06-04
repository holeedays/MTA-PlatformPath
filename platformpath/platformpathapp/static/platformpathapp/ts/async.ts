async function getDOMElement(id: string, waitTimeMS: number): Promise<HTMLElement> {

    while (document.getElementById(id) === null) {
        await new Promise((res) => { setTimeout(res, waitTimeMS) });
    }

    console.log("Success!");
    return document.getElementById(id) as HTMLElement;
}

(window as any).getDOMElement = getDOMElement;
