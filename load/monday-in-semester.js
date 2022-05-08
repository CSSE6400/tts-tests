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
        newcourse: {
            executor: "shared-iterations", // should only ever have 20
            vus: 4,
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
        Qscenario: "monday-in-semester",
    },
    minIterationDuration: '20s'
};

const course_material = new SharedArray('course-material', function () {
    return JSON.parse(open('./data/course-material.json'));
});
const monday_announcement = new SharedArray('monday-announcement', function () {
    return JSON.parse(open('./data/monday-announcement.json'));
});

export function uploadContent() {
    // decide on content to upload
    const content = course_material[Math.floor(Math.random() * course_material.length)];

    // should be around 2500 characters
    testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );

    // Excellent, I've uploaded my stuff, home time!
}

export function sendAnnouncement() {
    // decide on an announcement
    const content = monday_announcement[Math.floor(Math.random() * monday_announcement.length)];

    testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );

    // Excellent, I've uploaded my stuff, home time!
}