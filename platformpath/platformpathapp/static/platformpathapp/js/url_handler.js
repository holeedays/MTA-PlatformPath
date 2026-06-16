export class URLHandler {
    constructor() {
    }
    // get the current working URL path; e.g. https//:thisWebsite/thisPage1/thisPage2 <-- returns thisPage2
    static getCurrentWorkingURLRoute() {
        const fullURL = document.URL;
        const URLSubstrings = fullURL.split("/");
        let currentURLRoute = URLSubstrings[URLSubstrings.length - 1];
        if (currentURLRoute !== undefined) {
            currentURLRoute = currentURLRoute.split("?")[0];
        }
        return currentURLRoute === undefined ? null : currentURLRoute;
    }
    // get only the query parameters of the URL (in a suitable URL format)
    static getQueryParametersURL() {
        const url = new URL(document.URL);
        return url.searchParams.toString();
    }
    // get all query params in a key value array
    static getQueryParameters() {
        let queryParamsArray = {};
        const url = new URL(document.URL);
        url.searchParams.forEach((value, key, parent) => {
            if (queryParamsArray[key] === undefined)
                queryParamsArray[key] = [value];
            else
                queryParamsArray[key].push(value);
        });
        return queryParamsArray;
    }
    // adds a query parameter to our url and reloads it without refreshing the page
    static addQueryParameter(key, value) {
        const url = new URL(document.URL);
        // check if query param already exists in URL
        const regex = new RegExp(`${key}=${value}`);
        // if it didn't add it, do this
        if (!regex.test(document.URL)) {
            url.searchParams.append(key, value);
            window.history.replaceState({}, "", url);
        }
    }
    // clears a specifc query parameter
    static removeQueryParameter(key, value) {
        const url = new URL(document.URL);
        url.searchParams.delete(key, value);
        window.history.replaceState({}, "", url.pathname + url.search);
    }
    // redirect to a new page given the specified url, you can append more values to the string
    static redirectTo(baseURL, ...queryParams) {
        let fullURL = baseURL;
        // check if we have any valid query params
        let questionMarkAppended = false;
        for (const param of queryParams) {
            if (param != "" && !questionMarkAppended) {
                fullURL += "?";
                questionMarkAppended = true;
            }
            fullURL += param;
        }
        8;
        window.location.href = fullURL;
    }
}
//# sourceMappingURL=url_handler.js.map