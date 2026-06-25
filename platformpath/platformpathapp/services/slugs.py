from __future__ import annotations # makes python treat type hints like strings at runtime
from typing import TYPE_CHECKING

import re

if (TYPE_CHECKING):
    from ..models import Line, Station

def slugify(*args: str) -> str:
    # init the string that will hold all converted strings
    full_slugified_str: str = ""

    for i, arg in enumerate(args):
        # replace all special characters + white spaces with hyphens
        str_special_char_removed: str = re.sub(r"[^a-zA-Z0-9]", "-", arg, count=0)
        # determine whether this is the first string or the ones after
        if (i > 1):
            full_slugified_str += "-" + str_special_char_removed.lower()
        else:
            full_slugified_str += str_special_char_removed.lower()

    return full_slugified_str

# check if a line slug is valid by returning the model (or none) that the slug references
def check_line_slug(line_slug: str) -> Line | None:
    # have to import here to avoid a circular import issue since slugs module is called in models.py which causes a discrepancy
    # since Station and Line models aren't fully loaded in yet
    from ..models import Line

    # a sample line slug looks like this "orange-d-42"
    slug_data: list[str] = line_slug.split("-")

    # make sure there are only 3 items in the slug (refer to the sameple line slug I gave)
    if (len(slug_data) != 3):
        return None

    line_model: Line | None = None
    try: 
        # try to fetch the item (case insensitive), if it doesn't exist
        line_model = (Line.objects.filter(color__iexact=slug_data[0], 
                                          slug_name=slug_data[1], 
                                          id=int(slug_data[2]))
                                          .prefetch_related("station_set") # we have to fetch by _set since prefetch is not performed in SQL
                                          .first())
    # this is to account if the third part of the slug (which is the id) can't be converted to int 
    except ValueError:
        return None
    
    return line_model

# check if a station slug is valid by returning the model (or none) that the slug references
def check_station_slug(station_slug: str) -> Station | None:
    # have to import here to avoid a circular import issue since slugs module is called in models.py which causes a discrepancy
    # since Station and Line nmodels aren't fully loaded in yet
    from ..models import Station

    # a sample station slug looks like "bay-50-st-131"
    # we will only split this once from the string backwards
    slug_data: list[str] = station_slug.rsplit("-", maxsplit=1)

    station_model: Station | None = None
    try:
        # get our station model
        station_model = (Station.objects.filter(slug_name=slug_data[0], 
                                                id=int(slug_data[1]))
                                                .prefetch_related("lines")
                                                .first())
    # same check goes here, int(slug_data[1]]) might yield an error if it can't be converted
    except ValueError:
        return None

    return station_model

