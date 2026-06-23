export class Slugifier {
    // a hashmap of all previously slugified strings for this class instance
    public cache: Record<string, (string | number)[]>;

    constructor() {
        this.cache = {};
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

        // saves the slug so we can deslugify the term if we wanted to later
        if (!(fullSlugifiedterm in this.cache)) {
            this.cache[fullSlugifiedterm] = terms;
        }
        // in the case the key already exists, we will just append those values to the existing array of strings
        else {
            for (const term in terms) {
                this.cache[fullSlugifiedterm]?.push(term);
            }
        }

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
}