// class for making calls to the django API (to access the database)
export class DataFetch {
    constructor() {
    }

    // get the specified cookie based on the string (pulled from django's example code)
    public static getCookie(name: string): string {
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
    // get the csrf token
    public static getCSRFToken() {
        return this.getCookie("csrftoken");
    }

    // fetch all available subway lines in the database
    public static async fetchLinesNew(): Promise<any | null> {
        const fetchURL: string = "/api/lines/";

        try {
            const response = await fetch(fetchURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": DataFetch.getCSRFToken()
                }
            }); 

            if (!response.ok) 
                throw new Error("Failed to fetch lines");

            const data: any = await response.json();
            return data;
        }
        catch(err: any) {
            console.warn(err);
            return null;
        }
    }

    // fetch stations based on the given line name
    public static async fetchStationsNew(lineSlug: string): Promise<any | null> {
        const fetchURL: string = `/api/lines/${lineSlug}/stations/`;

        try {
            const response = await fetch(fetchURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": DataFetch.getCSRFToken()
                }
            }); 

            if (!response.ok) 
                throw new Error(`Failed to fetch stations for the ${lineSlug} subway line`);

            const data: any = await response.json();
            return data;
        }
        catch(err: any) {
            console.warn(err);
            return null;
        }
    }

    public static async fetchEdgesNodesNew(lineSlug: string, stationSlug: string): Promise<any | null> {
        const fetchURL: string = `/api/lines/${lineSlug}/stations/${stationSlug}/edges_nodes/`;

        try {
            const response = await fetch(fetchURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": DataFetch.getCSRFToken()
                }
            }); 

            if (!response.ok) 
                throw new Error(`Failed to fetch the edges and nodes for the station ${stationSlug} of the ${lineSlug} subway line`);

            const data: any = await response.json();
            return data;
        }
        catch(err: any) {
            console.warn(err);
            return null;
        }
    }



    ///////////////////////////////////////////////////////////// ANTIQUATED WILL REMOVE LATER ON...

    // fetch all available subway lines from the db
    public static async fetchLines(fetchURL: string): Promise<any | null> {
        try {
            // technically a GET request would work, but it would store the data as query parameters (e.g. in the URL) in its header
            // which is limiting and requires us to access it in a different way but it avoids the need for sending CSRF tokens
            // POST puts all the information in its body
            const response = await fetch(fetchURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": DataFetch.getCSRFToken()
                }
            });

            // see if response is successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log("Successfully fetched all subway lines!");
            const data = await response.json();
            return data;
        }
        catch (err: any) {
            console.error(`Failed to fetch all subway lines: ${err}`);
            return null;
        }
    }

    // fetch all relevant stations (ordered) based on an array of line names
    public static async fetchStations(lineNames: string[], fetchURL: string): Promise<any | null> {
        try {
            const response = await fetch(fetchURL, {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": DataFetch.getCSRFToken()
                },
                body: JSON.stringify(lineNames)
            });

            // see if response is successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // if it is return our json objects
            console.log("Successfully got all stations!");
            const data = await response.json();
            return data; 
        }
        catch (err: any) {
            console.error("Failed to retrieve the following stations", err);
            return null;
        }
    }


    // fetch all relevant nodes and edges from an array of station names
    public static async fetchEdgesNodes(stationNames: string[], fetchURL: string): Promise<any | null> {
        try {
            const response = await fetch(fetchURL, {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": DataFetch.getCSRFToken()
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