class DataFetch {
    constructor() {
    }
    // get the csrf token embedded in our browser's cookie
    getCookie(name) {
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
    // fetch our station
    async fetchStations(stations, fetchURL) {
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
                body: JSON.stringify(stations)
            });
            // see if response is successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // if it is get our json objects
            console.log("Success!");
            const data = await response.json();
            return data;
        }
        catch (err) {
            console.error("Failed to retrieve the following stations", err);
            return null;
        }
    }
}
export {};
//# sourceMappingURL=data_fetch.js.map