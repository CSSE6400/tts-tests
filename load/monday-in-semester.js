import { Rate } from "k6/metrics";
import { SharedArray } from 'k6/data';
import { testAsyncAudio } from "./requests/async.js";

const queries = new Rate("queries");
const mutations = new Rate("mutations");

export const options = {
    rps: 50,
    scenarios: {
        newcourse: {
            executor: "shared-iterations", // should only ever have 20
            vus: 4,
            iterations: 20,
            exec: 'uploadContent',
            maxDuration: '1h',
        },
        announcements: {
            executor: "shared-iterations", // should only ever have 75
            vus: 10,
            iterations: 75,
            exec: 'sendAnnouncement',
            maxDuration: '1h',
        }
    },
    tags: {
        test: "load",
        Qscenario: "monday-in-semester",
    },
    minIterationDuration: '20s'
};

const course_material = new SharedArray('course-material', function() {
    return JSON.parse(open('./data/course-material.json'));
});
const monday_announcement = new SharedArray('monday-announcement', function() {
    return JSON.parse(open('./data/monday-announcement.json'));
});

export function uploadContent() {
    // decide on content to upload
    const content = course_material[Math.floor(Math.random() * course_material.length)];

    // should be around 2500 characters
    let success = testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );
    mutations.add(success, { endpoint: "/text", operation: "ASYNC", label: "Upload New Course Content" });

    // Excellent, I've uploaded my stuff, home time!
}

export function sendAnnouncement() {
    // decide on an announcement
    const content = monday_announcement[Math.floor(Math.random() * monday_announcement.length)];

    let success = testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );
    mutations.add(success, { endpoint: "/text", operation: "ASYNC", label: "Send Announcement" });

    // Excellent, I've uploaded my stuff, home time!
}