from ..models import Line, Station

class SlugVerifier():
    def __init__(self) -> None:
        pass

    # check if a line slug is valid by returning the model (or none) that the slug references
    @staticmethod
    def check_line_slug(line_slug: str) -> Line | None:
        # a sample line slug looks like this "orange-d-42"
        slug_data: list[str] = line_slug.split("-")

        # make sure there are only 3 items in the slug (refer to the sameple line slug I gave)
        if (len(slug_data) != 3):
            return None

        line_model: Line | None = None
        try: 
            # try to fetch the item (case insensitive), if it doesn't exist
            line_model = (Line.objects.filter(color__iexact=slug_data[0], 
                                             name__iexact=slug_data[1], 
                                             id=int(slug_data[2]))
                                             .prefetch_related("station_set")
                                             .first())
        # this is to account if the third part of the slug (which is the id) can't be converted to int 
        except ValueError:
            return None
        
        return line_model
    
    # check if a station slug is valid by returning the model (or none) that the slug references
    @staticmethod
    def check_station_slug(station_slug: str) -> Station | None:
        # a sample station slug looks like "bay-50-st-131"
        slug_data: list[str] = station_slug.split("-")

        # if the slug doesn't have at least one hyphen, it is automatically not a valid station slug
        # furthermore, it isn't actually possible to have a single worded station in the MTA subway station :)
        if (len(slug_data) < 2):
            return None

        station_model: Station | None = None
        try:
            # fetch the name and id... we have to reassemble the name given it'll probably have multiple hyphens
            name: str = "" 
            for i in range(len(slug_data)-1):
                chunk: str = slug_data[i]

                if (i == 0):
                    name += chunk
                else:
                    name += " " + chunk

            id: int = int(slug_data[-1])

            # get our station model
            station_model = (Station.objects.filter(name__iexact=name, id=id)
                             .prefetch_related("lines")
                             .first())
        # same check goes here, int(slug_data[-1]) might yield an error if it can't be converted
        except ValueError:
            return None

        return station_model

