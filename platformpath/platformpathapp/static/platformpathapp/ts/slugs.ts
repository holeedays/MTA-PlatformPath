// slugify a list of terms to be URL slug friendly
export function slugify(...terms: (string | number)[]): string {
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

    return fullSlugifiedterm;
}

// extracts value from slug and returns it (in our case it will be IDs from the url slugs)
export function extractValueFromSlug(slug: string, position: number): string | null {
    const slugSplit: string[] | undefined = slug.split("-");
    const value: string | undefined = slugSplit?.at(position);

    if (value === undefined)
        return null;
    else 
        return value;
}
