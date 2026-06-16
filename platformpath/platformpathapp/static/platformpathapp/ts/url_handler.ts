
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

    // get only the query parameters of the URL (in a suitable URL format)
    public static getQueryParametersURL(): string {
        const url = new URL(document.URL);        
        return url.searchParams.toString();
    }

    // get all query params in a key value array
    public static getQueryParameters(): Record<string,string[]> {
        let queryParamsArray: Record<string,string[]> = {};
        const url = new URL(document.URL);
        url.searchParams.forEach((value: string, key: string, parent: URLSearchParams) => {
            if (queryParamsArray[key] === undefined) 
                queryParamsArray[key] = [value];
            else
                queryParamsArray[key].push(value);
        });

        return queryParamsArray;
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

    // clears a specifc query parameter
    public static removeQueryParameter(key: string, value?: string): void {
        const url = new URL(document.URL);

        url.searchParams.delete(key, value);
        window.history.replaceState({}, "", url.pathname + url.search);
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