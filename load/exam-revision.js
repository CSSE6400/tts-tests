import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

import { checkModelList, checkModel } from "./checks/model.js";
import { checkTextList, checkText } from "./checks/text.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;

const load = new Rate("load");

export const options = {
    rps: 50,
    scenarios: {
        text: {
            executor: "ramping-vus",
            stages: [
                { duration: "5m", target: 200 },
                { duration: "2m", target: 800 },
                { duration: "2m", target: 600 },
                { duration: "2m", target: 1000 },
                { duration: "2m", target: 1000 },
                { duration: "1m", target: 900 },
                { duration: "2m", target: 1000 },
                { duration: "2m", target: 750 },
                { duration: "1m", target: 750 },
                { duration: "2m", target: 200 },
                { duration: "1m", target: 200 },
                { duration: "1m", target: 0 },
            ],
            exec: 'examScenario',
        },
    },
    tags: {
        test: "load",
        Qscenario: "exam-revision",
    },
    minIterationDuration: '125s'
};

export function examScenario() {
    let url = BASE_URL + `/text`;
    let request = http.get(url, { tags: { endpoint: "/text" } });

    let data = request.json().data;
    let success = check(request, checkTextList, { endpoint: "/text" });
    load.add(success, { endpoint: "/text" });

    // I've got to find my courses text data in this list!
    // Don't the devs know I have an exam??
    sleep(5);
    // Ah found it! Of course it was the first thing I saw :(

    url = BASE_URL + `/text/${data[0].id}`;
    request = http.get(url, { tags: { endpoint: "/text/{id}" } });

    success = check(request, checkText, { endpoint: "/text/{id}" });
    load.add(success, { endpoint: "/text/{id}" });

    // Now I need to download the audio
    url = request.json().resource;
    request = http.get(url, { tags: { endpoint: "/download" } });

    success = check(request, {
        "Status is 200": (r) => r.status === 200,
    }, { endpoint: "/download" });

    // Alright I'll listen to this chapter for two minutes
    sleep(120);
}