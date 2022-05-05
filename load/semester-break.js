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
        model: {
            executor: "ramping-vus",
            stages: [
                { duration: "5m", target: 10 },
                { duration: "2m", target: 5 },
                { duration: "2m", target: 15 },
                { duration: "2m", target: 10 },
                { duration: "2m", target: 0 },
            ],
            exec: 'modelScenario',
        },
        text: {
            executor: "ramping-vus",
            stages: [
                { duration: "5m", target: 10 },
                { duration: "2m", target: 15 },
                { duration: "2m", target: 5 },
                { duration: "2m", target: 10 },
                { duration: "2m", target: 0 },
            ],
            exec: 'textScenario',
        },
    },
    tags: {
        test: "load",
        Qscenario: "semester-break",
    },
    minIterationDuration: '10s'
};

export function modelScenario() {
    let url = BASE_URL + `/model`;
    let request = http.get(url, { tags: { endpoint: "/model" } });

    let success = check(request, checkModelList, { endpoint: "/model" });
    load.add(success, { endpoint: "/model" });

    sleep(5);

    url = BASE_URL + `/model/tts_models.en.ljspeech.glow-tts`;
    request = http.get(url, { tags: { endpoint: "/model/{id}" } });

    success = check(request, checkModel,
                    { endpoint: "/model/{id}" });
    load.add(success, { endpoint: "/model/{id}" });

    sleep(5);
}

export function textScenario() {
    let url = BASE_URL + `/text`;
    let request = http.get(url, { tags: { endpoint: "/text" } });

    let data = request.json().data;
    let success = check(request, checkTextList, { endpoint: "/text" });
    load.add(success, { endpoint: "/text" });

    sleep(20);

    url = BASE_URL + `/text/${data[0].id}`;
    request = http.get(url, { tags: { endpoint: "/text/{id}" } });

    success = check(request, checkText, { endpoint: "/text/{id}" });
    load.add(success, { endpoint: "/text/{id}" });

    sleep(20);
}
