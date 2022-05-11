import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

import { checkModelList, checkModel } from "./checks/model.js";
import { checkTextList, checkText } from "./checks/text.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;

const queries = new Rate("queries");
const mutations = new Rate("mutations");
const errors = new Rate("errors");

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

    let success;
    try {
        success = check(request, checkModelList, { endpoint: "/model" });
    } catch (e) {
        console.log(e);
        errors.add(1, { endpoint: "/model" });
    }
    queries.add(success, { endpoint: "/model" });

    sleep(5);

    url = BASE_URL + `/model/tts_models.en.ljspeech.glow-tts`;
    request = http.get(url, { tags: { endpoint: "/model/{id}" } });

    try {
        success = check(request, checkModel, { endpoint: "/model/{id}" });
    } catch (e) {
        console.log(e);
        errors.add(1, { endpoint: "/model/{id}" });
    }
    queries.add(success, { endpoint: "/model/{id}" });

    sleep(5);
}

export function textScenario() {
    let url = BASE_URL + `/text`;
    let request = http.get(url, { tags: { endpoint: "/text" } });

    let data;
    let success;
    try {
        data = request.json().data;
        success = check(request, checkTextList, { endpoint: "/text" });
    } catch (e) {
        console.log(e);
        errors.add(1, { endpoint: "/text" });
    }
    queries.add(success, { endpoint: "/text" });

    sleep(20);

    url = BASE_URL + `/text/${data[0].id}`;
    request = http.get(url, { tags: { endpoint: "/text/{id}" } });

    try {
        success = check(request, checkText, { endpoint: "/text/{id}" });
    } catch (e) {
        console.log(e);
        errors.add(1, { endpoint: "/text/{id}" });
    }
    queries.add(success, { endpoint: "/text/{id}" });

    sleep(20);
}