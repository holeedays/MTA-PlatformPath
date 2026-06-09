import { DataFetch } from "./data_fetch.ts";

const df: DataFetch = new DataFetch();
const stations: string[] = ["Bay 50 St"];
const apiURL = "platformPathAPI/fetchEdgesNodes";


const results: any = await df.fetchEdgesNodes(stations, apiURL);

console.log(results["Bay 50 St"].edge_models);
