import { DataFetch } from "./data_fetch.js";
const df = new DataFetch();
const stations = ["Bay 50 St"];
const apiURL = "platformPathAPI/fetchEdgesNodes";
const results = await df.fetchEdgesNodes(stations, apiURL);
console.log(results["Bay 50 St"].edge_models);
//# sourceMappingURL=app_new.js.map