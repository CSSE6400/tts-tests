import http from "k6/http";
import { group, check, fail, sleep } from "k6";
import { Rate } from "k6/metrics";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;
const url = BASE_URL + `/text`;

const DEFAULT_TIMEOUT = 20; // seconds
const WAIT_TIME = 240; // seconds (4 minutes)
const POLL_INTERVAL = 5; // seconds

function requestAudioGeneration(message, model) {
    let body = {
        "message": message,
        "model": model,
        "operation": "ASYNC"
    };
    let timeout = DEFAULT_TIMEOUT
    let params = {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: `${timeout}s`,
        tags: { operation: "async", action: "request" }
    };
    let request = http.post(url, JSON.stringify(body), params);

    let failed = !check(request, {
        "Response code of post request is 200 (healthy)": (r) => r.status === 200,
        "Response has an id field": (r) => r.json().id,
    }, { operation: "async" });
    if (failed) {
        return null;
    }

    return request.json().id;
}

function downloadAudio(url) {
    let params = { headers: { 'Accept': 'audio/wav' }, responseType: 'binary',
                   tags: { operation: "async", action: "download" } };
    let request = http.get(url, params);

    check(request, {
        "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
    }, { operation: "async" });

    return request.body;
}

function pollForAudio(requestID) {
    let audioUrl = `${url}/${requestID}`;
    let params = { headers: { 'Accept': 'application/json' },
                   tags: { operation: "async", action: "poll" } };
    let request = http.get(audioUrl, params);

    let ready = request.json().status === "COMPLETED";
    if (ready) {
        check(request, {
            "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
            "Status field is 'COMPLETED'": (r) => r.json().status === "COMPLETED",
            "Resource field is a string": (r) => _.isString(r.json().resource),
        }, { operation: "async" });
        return request.json().resource;
    }

    return null;
}

export function testAsyncAudio(message, model, expected, label=null) {
    if (label === null) {
        label = message;
    }
    let requestID = requestAudioGeneration(message, model);
    if (requestID === null) {
        return;
    }

    // Wait for the audio to be generated
    let audioUrl = null;
    let startTime = Date.now();
    while (audioUrl === null) {
        audioUrl = pollForAudio(requestID);
        if (audioUrl === null) {
            let elapsedTime = Date.now() - startTime;
            if (elapsedTime > WAIT_TIME * 1000) {
                fail(`Audio generation timed out after ${WAIT_TIME} seconds`);
                return;
            }
            sleep(POLL_INTERVAL);
        }
    }

    let audio = downloadAudio(audioUrl);
    let audioLength = audio.byteLength;

    console.log(`message: ${message} length: ${audioLength}, expected: ${expected}`);
    let success = check(audioLength, {
        "Length of audio matches": (h) => h === expected,
    }, {operation: "async", message: label, model: model });

    return success;
}
