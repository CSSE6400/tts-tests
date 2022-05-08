import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import { SharedArray } from 'k6/data';

import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

import { checkModelList, checkModel } from "./checks/model.js";
import { checkTextList, checkText } from "./checks/text.js";
import { testAsyncAudio } from "./requests/async.js";

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
                { duration: "4m", target: 2000 },
                { duration: "5m", target: 2000 },
                { duration: "5m", target: 0 },
            ],
            exec: 'studyingStudent',
        },
        teacher: {
            executor: "shared-iterations", // should only ever have 30 uploads
            vus: 5,
            iterations: 30,
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

const revision_material = new SharedArray('revision-material', function () {
    return JSON.parse(open('./data/revision-material.json'));
});

export function uploadingTeacher() {
    // decide on content to upload
    const content = revision_material[Math.floor(Math.random() * revision_material.length)];

    testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );

    // Excellent, I've uploaded my stuff, home time!
    sleep(100);
}