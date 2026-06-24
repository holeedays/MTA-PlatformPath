export class Slugifier {
    // a hashmap of all previously slugified strings for this class instance
    public cache: Record<string, (string | number)[]>;

    constructor() {
        this.cache = {};

        this.setupCache();
        console.log(this.cache);
    }

    // slugify a list of terms to be URL slug friendly
    public slugify(...terms: (string | number)[]): string {
        let fullSlugifiedterm: string = "";

        for (let i=0; i<terms.length; i++) {
            // since we can accept numbers as well, we have to stringify it if that's the case
            const stringifiedTerm: string | undefined = String(terms[i]);
            // use this regex pattern to replace all special characters (excluding hyphens and underscores) with hyphens
            const termSlugified: string | undefined = stringifiedTerm?.replaceAll(/[^a-zA-Z0-9-_]/g, "-");
            if (termSlugified === undefined)
                continue;

            // each new term will also be separated by a hyphen (excluding the first term)
            // also make the term lower case to follow standard URL slug convention
            if (i !== 0) {
                fullSlugifiedterm += "-";
            }
            fullSlugifiedterm += termSlugified.toLowerCase();
        }

        // cache this term into our cache
        this.cacheTerms(fullSlugifiedterm, terms);

        return fullSlugifiedterm;
    }

    // NOTE: You can only deslugify terms that you've used previously with this slugifier class instance 
    // deslugifies a slugifiedTerms (if it exists within this current class instance)
    public deslugify(slugfiedTerm: string): (string | number)[] {
        const originalTerms: (string | number)[] | undefined = this.cache[slugfiedTerm];

        if (originalTerms === undefined) {
            console.warn("This slugified string does exist in our cache but yields an undefined value");
            return [slugfiedTerm];
        }
        else {
            return originalTerms;
        }
    }

    // saves a slug so we can deslugify the term if we wanted to later, used in slugify()
    private cacheTerms(slugifiedTerm: string, terms: (string | number)[]): void {
        this.cache[slugifiedTerm] = terms;
        // besides saving it to our local cache, save it to our session storage cache
        sessionStorage.setItem("slugifierCache", JSON.stringify(this.cache));
    }

    // sets up the logic for our slugifier cache
    private setupCache(): void {
        // retrieve any previously uploaded cache data in our session, if any
        const cacheStringified: string | null = sessionStorage.getItem("slugifierCache");
        if (cacheStringified !== null) {
            this.cache = JSON.parse(cacheStringified);
        }

        // Keep the cache updated if restored from bfcache (e.g. sometimes browsers like to store javascript states in
        // memory when backtracking a page, this deals with that)
        window.addEventListener("pageshow", () => {
            const cacheStringified: string | null = sessionStorage.getItem("slugifierCache");
            if (cacheStringified !== null) {
               this.cache = JSON.parse(cacheStringified);
            }
        });
    }
}