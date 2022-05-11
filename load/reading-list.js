import { Rate } from "k6/metrics";
import { SharedArray } from 'k6/data';
import { testAsyncAudio } from "./requests/async.js";

const queries = new Rate("queries");
const mutations = new Rate("mutations");

export const options = {
    rps: 50,
    scenarios: {
        teacher: {
            executor: "shared-iterations", // should only ever have 100 uploads
            vus: 10,
            iterations: 100,
            exec: 'submitReadingList',
            maxDuration: '1h',
        },
    },
    tags: {
        test: "load",
        Qscenario: "reading-list",
    },
    minIterationDuration: '20s'
};

const reading_lists = new SharedArray('reading-lists', function() {
    return JSON.parse(open('./data/reading-lists.json'));
});

export function submitReadingList() {
    // decide on content to upload
    const content = reading_lists[Math.floor(Math.random() * reading_lists.length)];

    // should be around 7000 characters
    let success = testAsyncAudio(
        content[0],
        "tts_models.en.ljspeech.glow-tts",
        content[1]
    );
    mutations.add(success, { endpoint: "/text", operation: "ASYNC", label: "Upload New Reading List" });

    // Excellent, I've uploaded my stuff, home time!
}