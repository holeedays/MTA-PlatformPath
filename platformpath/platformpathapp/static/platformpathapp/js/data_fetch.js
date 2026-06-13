// class for making calls to the django API (to access the database)
export class DataFetch {
    constructor() {
    }
    // get the specified cookie based on the string (pulled from django's example code)
    static getCookie(name) {
        let cookieValue = "";
        if (document.cookie &&
            document.cookie !== "") {
            const cookies = document.cookie.split(";");
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
    static getCSRFToken() {
        return this.getCookie("csrftoken");
    }
    // fetch all available subway lines from the db
    static async fetchLines(fetchURL) {
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
        catch (err) {
            console.error(`Failed to fetch all subway lines: ${err}`);
            return null;
        }
    }
    // fetch all relevant stations (ordered) based on an array of line names
    async fetchStations(lineNames, fetchURL) {
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
        catch (err) {
            console.error("Failed to retrieve the following stations", err);
            return null;
        }
    }
    // fetch all relevant nodes and edges from an array of station names
    async fetchEdgesNodes(stationNames, fetchURL) {
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
        catch (err) {
            console.error("Failed to retrieve the following stations", err);
            return null;
        }
    }
}
//# sourceMappingURL=data_fetch.js.map