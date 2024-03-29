const fetch = require("node-fetch");
// TODO: use embedbase-js and ts when it's supporting clear()
const url = "https://embedbase-hosted-usx5gpslaq-uc.a.run.app";
const vaultId = "embedbase-documentation";
try {
    require("dotenv").config();
} catch (e) {
    console.log("No .env file found" + e);
}
const apiKey = process.env.EMBEDBASE_API_KEY;
const clear = async () => {
    const response = await fetch(url + "/v1/" + vaultId + "/clear", {
        method: "GET",
        headers: {
            Authorization: "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
    });
    const data = await response.json();
    console.log(data);
}

clear();
