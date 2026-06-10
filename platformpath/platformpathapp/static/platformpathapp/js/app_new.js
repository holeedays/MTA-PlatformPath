import { DataFetch } from "./data_fetch.js";
const df = new DataFetch();
const lines = ["D"];
const stations = ["Bay 50 St"];
const linesFetchApiURL = "platformpathAPI/fetchLines";
const stationsFetchApiURL = "platformpathAPI/fetchStations";
const edgeNodesFetchApiURL = "platformPathAPI/fetchEdgesNodes";
const linesFetchResult = await df.fetchLines(linesFetchApiURL);
const stationsFetchResult = await df.fetchStations(lines, stationsFetchApiURL);
const edgeNodesFetchResult = await df.fetchEdgesNodes(stations, edgeNodesFetchApiURL);
// setting it up like this because console logging text inline with the json objects 
// does not allow an expandable view of the object (it just returns object[object])
console.log("These are all available MTA lines currently:");
console.log(linesFetchResult);
console.log("These are all available stations for the D:");
console.log(stationsFetchResult);
console.log("These are edges and nodes pulled for Bay 50 St:");
console.log(edgeNodesFetchResult);
//# sourceMappingURL=app_new.js.map