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
        teacher: {
            executor: "shared-iterations", // should only ever have 100 uploads
            vus: 10,
            iterations: 100,
            exec: 'submitReadingList',
        },
    },
    tags: {
        test: "load",
        Qscenario: "reading-list",
    },
    minIterationDuration: '20s'
};

const reading_lists = new SharedArray('reading-lists', function () {
    return JSON.parse(open('./data/reading-lists.json'));
});

export function submitReadingList() {
    // decide on content to upload
    const content = reading_lists[Math.floor(Math.random() * reading_lists.length)];

    // should be around 7000 characters
    testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );

    // Excellent, I've uploaded my stuff, home time!
}