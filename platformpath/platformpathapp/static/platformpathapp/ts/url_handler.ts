
export class URLHandler {
    constructor() {
    }

    // get the current working URL path; e.g. https//:thisWebsite/thisPage1/thisPage2 <-- returns thisPage2
    public static getCurrentWorkingURLRoute(): string | null {
        const fullURL: string = document.URL;
        const URLSubstrings: string[] = fullURL.split("/");
        let currentURLRoute: string | undefined = URLSubstrings[URLSubstrings.length - 1];

        if (currentURLRoute !== undefined) {
            currentURLRoute = currentURLRoute.split("?")[0];
        }
        
        return currentURLRoute === undefined ? null : currentURLRoute;
    }

    // get only the query parameters of the URL
    public static getQueryParameters(): string {
        const fullURL: string = document.URL;
        const URLSubstrings: string[] = fullURL.split("/");
        const currentURLRoute: string | undefined = URLSubstrings[URLSubstrings.length - 1];
        let queryParametersURL: string | undefined = "";

        if (currentURLRoute !== undefined) {
            queryParametersURL = currentURLRoute.split("?")[1];
        }
        
        return queryParametersURL === undefined ? "" : queryParametersURL;
    }

    // adds a query parameter to our url and reloads it without refreshing the page
    public static addQueryParameter(key: string, value: string): void {
        const url = new URL(document.URL);
        // check if query param already exists in URL
        const regex: RegExp = new RegExp(`${key}=${value}`);

        // if it didn't add it, do this
        if (!regex.test(document.URL)) {
            url.searchParams.append(key, value);
            window.history.replaceState({}, "", url);
        }
    }

    // clears all existing query parameters, if any
    public static clearAllQueryParameters(): void {
        const url = new URL(document.URL);

        url.searchParams.forEach((value: string, key: string, parent: URLSearchParams) => {
            parent.delete(key, value);
        });
        window.history.replaceState({}, "", url.pathname);
    }

    // clears a specifc query parameter
    public static removeQueryParameter(key: string, value?: string): void {
        const url = new URL(document.URL);

        url.searchParams.delete(key, value);
        window.history.replaceState({}, "", url.pathname);
    }

    // redirect to a new page given the specified url, you can append more values to the string
    public static redirectTo(baseURL: string, ...queryParams: string[]): void {

        let fullURL: string = baseURL;
        // check if we have any valid query params
        let questionMarkAppended: boolean = false;
        for (const param of queryParams) {
            if (param != "" && !questionMarkAppended) {
                fullURL += "?";
                questionMarkAppended = true;
            }

            fullURL += param;
        }
8
        window.location.href = fullURL;
    }
}