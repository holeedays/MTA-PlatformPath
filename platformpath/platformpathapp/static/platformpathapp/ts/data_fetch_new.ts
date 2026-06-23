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
    public static async fetchLines(): Promise<any | null> {
        const fetchURL: string = "/api/lines";

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

    // fetch stations based on the given line id
    public static async fetchStations(lineID: number): Promise<any | null> {
        const fetchURL: string = `/api/lines/${lineID}/stations`;

        try {
            const response = await fetch(fetchURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": DataFetch.getCSRFToken()
                }
            }); 

            if (!response.ok) 
                throw new Error(`Failed to fetch stations for the subway line with id=${lineID}`);

            const data: any = await response.json();
            return data;
        }
        catch(err: any) {
            console.warn(err);
            return null;
        }
    }

    // fetch all edges and nodes for the given station id
    public static async fetchEdgesNodes(stationID: number): Promise<any | null> {
        const fetchURL: string = `/api/stations/${stationID}/edges_nodes`;

        try {
            const response = await fetch(fetchURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": DataFetch.getCSRFToken()
                }
            }); 

            if (!response.ok) 
                throw new Error(`Failed to fetch the edges and nodes for station model with id=${stationID}`);

            const data: any = await response.json();
            return data;
        }
        catch(err: any) {
            console.warn(err);
            return null;
        }
    }
}