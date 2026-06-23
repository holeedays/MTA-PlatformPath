
export class URLHandler {
    constructor() {
    }

    // get the current working URL path; e.g. https//:thisWebsite/thisPage1/thisPage2 <-- returns thisPage2
    public static getCurrentWorkingURLRoute(): string | null {
        const fullURL: string = document.URL;
        const URLSubstrings: string[] = fullURL.split("/");

        // if the url has a / at the end, the last item of the string is an empty string
        // hence we check for the item that's not empty
        for (let i=URLSubstrings.length; i>0; i--) {
            // get the entire sub string
            const subString: string | undefined = URLSubstrings[i];
            if (subString === undefined)
                continue;
            // check the substring without query params (if it has any) --> should yield a string array like this ["actualURL", "queryParams"]
            const subStringWithoutQueryParams: string | undefined = subString.split("?")[0];
            // if it yields not an empty string, then we return that 
            if (subStringWithoutQueryParams !== undefined && subStringWithoutQueryParams !== "") {
                return subStringWithoutQueryParams;
            }            
        }

        return null;
    }

    // returns the current entire url
    public static getFullURLRoute(): string {
        return document.URL;
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
        // add query params if they exist
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