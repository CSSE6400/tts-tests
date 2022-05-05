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
        student: {
            executor: "ramping-vus",
            stages: [
                { duration: "8m", target: 1000 },
                { duration: "4m", target: 3500 },
                { duration: "5m", target: 3500 },
                { duration: "5m", target: 0 },
            ],
            exec: 'studyingStudent',
        },
        teacher: {
            executor: "ramping-vus",
            stages: [
                { duration: "10m", target: 30 },
                { duration: "10m", target: 0 },
            ],
            minIterationDuration: '1200s', // should only ever had 30 staff uploads (20 * 60)
            exec: 'uploadingTeacher',
        },
    },
    tags: {
        test: "load",
        Qscenario: "monday-exam-block",
    },
    minIterationDuration: '125s'
};

export function studyingStudent() {
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

// about 3500 characters each
const courseSummaries = [

];

export function uploadingTeacher() {
    testAsyncAudio(
        "Hello CSSE6400",
        "tts_models.en.ljspeech.glow-tts",
        83532
    );

    // Excellent, I've uploaded my stuff, home time!
    sleep(1200);
}
