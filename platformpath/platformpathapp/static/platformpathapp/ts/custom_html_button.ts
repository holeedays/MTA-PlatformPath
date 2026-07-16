export class CustomHTMLButton {
    // retainer for all event listeners stored in the element
    public eventListenerHandlers: {eventListener: string, handler: ((ev: Event) => void)}[];
    public self: HTMLButtonElement;

    constructor() {
        this.eventListenerHandlers = [];
        this.self = document.createElement("button");
    }

    // clear all event listeners
    public clearEventListeners() {
        while (this.eventListenerHandlers.length > 0) {
            const eventListenerObj: {
                eventListener: string, 
                handler: ((ev: Event) => void)
            } | undefined = this.eventListenerHandlers.pop();

            if (eventListenerObj !== undefined) {
                this.self.removeEventListener(eventListenerObj.eventListener, eventListenerObj.handler);
            }
        }
    }

    // add event listeners
    public addEventListener(eventListener: string, handler: ((ev: Event) => void)) {
        this.self.addEventListener(eventListener, handler);
        this.eventListenerHandlers.push({eventListener, handler});
    }
}