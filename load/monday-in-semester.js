import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
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
        newcourse: {
            executor: "shared-iterations", // should only ever have 1,957 uploads
            vus: 2,
            iterations: 20,
            exec: 'uploadContent',
        },
        announcements: {
            executor: "shared-iterations", // should only ever have 75
            vus: 10,
            iterations: 75,
            exec: 'sendAnnouncement',
        }
    },
    tags: {
        test: "load",
        Qscenario: "teaching-cancelled",
    },
    minIterationDuration: '20s'
};

export function uploadContent() {
    // should be around 2500 characters
    testAsyncAudio(
        "Dear class, The university has decided to cancel all classes (both on-line and in-person) for the remainter fo the week. We will let you know about how these classes will be caught up when the university informs us further. Thank you for your patience and understanding.",
        "tts_models.en.ljspeech.glow-tts",
        804492
    );

    // Excellent, I've uploaded my stuff, home time!
}

export function sendAnnouncement() {
    testAsyncAudio(
        "Dear class, The university has decided to cancel all classes (both on-line and in-person) for the remainter fo the week. We will let you know about how these classes will be caught up when the university informs us further. Thank you for your patience and understanding.",
        "tts_models.en.ljspeech.glow-tts",
        804492
    );

    // Excellent, I've uploaded my stuff, home time!
}