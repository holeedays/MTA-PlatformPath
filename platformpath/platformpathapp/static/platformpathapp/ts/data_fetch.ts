export class DataFetch {
    constructor() {
    }

    // get the csrf token embedded in our browser's cookie
    private getCookie(name: string): string {
        let cookieValue: string = "";
        if (document.cookie && 
            document.cookie !== "") {
            const cookies: string[] = document.cookie.split(";");
            for (const cookie of cookies) {
                const cookieTrimmed = cookie.trim();
                // Does this cookie string begin with the name we want?
                if (cookieTrimmed.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookieTrimmed.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // fetch all relevant stations (ordered) based on an array of line names
    public async fetchStations(lineNames: string[], fetchURL: string): Promise<any> {
        
    }


    // fetch all relevant nodes and edges from an array of station names
    public async fetchEdgesNodes(stationNames: string[], fetchURL: string): Promise<any> {
        try {
            const response = await fetch(fetchURL, {
                // technically a GET request would work, but it would store the data as query parameters (e.g. in the URL) in its header
                // which is limiting and requires us to access it in a different way but it avoids the need for sending CSRF tokens
                // POST puts all the information in its body
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": this.getCookie("csrftoken")
                },
                body: JSON.stringify(stationNames)
            });

            // see if response is successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // if it is get our json objects
            console.log("Successfully got all nodes and edges!");
            const data = await response.json();
            return data; 
        } 
        catch (err: any) {
            console.error("Failed to retrieve the following stations", err);
            return null;
        }
    }
}