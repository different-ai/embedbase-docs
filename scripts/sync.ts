const glob = require("glob");
const fs = require("fs");
import { createClient } from 'embedbase-js'
import { BatchAddDocument } from 'embedbase-js/dist/module/types';
import { splitText } from 'embeddings-utils';


const datasetId = "embedbase-documentation";
try {
    require("dotenv").config();
} catch (e) {
    console.log("No .env file found" + e);
}
// you can find the api key at https://app.embedbase.xyz
const apiKey = process.env.EMBEDBASE_API_KEY;
// this is using the hosted instance
const url = 'https://api.embedbase.xyz'
const embedbase = createClient(url, apiKey)

const sync = async () => {
    // read all files under pages/* with .mdx extension
    // for each file, read the content
    const documents = glob.sync("pages/**/*.mdx").map((path) => ({
        path: path.replace("pages/", "/").replace("index.mdx", "").replace(".mdx", ""),
        // content of the file
        data: fs.readFileSync(path, "utf-8")
    }));
    const chunks = []
    documents.map((document) =>
        splitText(document.data, { maxTokens: 500, chunkOverlap: 200 }, async (chunk) => chunks.push({
            data: chunk,
            metadata: {
                path: document.path
            }
        }))
    )

    console.log("Syncing " + chunks.map((d) => d.metadata.path).join(", "));

    const batchSize = 100;
    // add to embedbase by batches of size 100
    return Promise.all(
        chunks.reduce((acc: BatchAddDocument[][], chunk, i) => {
            if (i % batchSize === 0) {
                acc.push(chunks.slice(i, i + batchSize));
            }
            return acc;
        }, []).map((chunk) => embedbase.dataset(datasetId).batchAdd(chunk))
    ).catch(console.error)
        .then((e) => console.log("done", e));
}

sync();