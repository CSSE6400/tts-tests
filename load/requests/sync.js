import http from "k6/http";
import { Rate } from "k6/metrics";
import { group, check } from "k6";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;
const url = BASE_URL + `/text`;

const DEFAULT_TIMEOUT = 120;

const errors = new Rate("errors");

function generateAudioAndValidateResponse(message, model, extraTime) {
    let body = {
        "message": message,
        "model": model,
        "operation": "SYNC"
    };
    let timeout = DEFAULT_TIMEOUT + (extraTime || 0);
    let params = {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: `${timeout}s`,
        tags: { operation: "sync", action: "request" }
    };
    let request = http.post(url, JSON.stringify(body), params);

    let failed;
    try {
        failed = !check(request, {
            "Response code of post request is 200 (healthy)": (r) => r.status === 200,
            "Status field is 'COMPLETED'": (r) => r.json().status === "COMPLETED",
            "Resource field is a string": (r) => _.isString(r.json().resource),
        }, { operation: "sync" });
        if (failed) {
            return null;
        }

        return request.json().resource;
    } catch (e) {
        errors.add(1, { operation: "sync", message: message, model: model });
        throw e;
    }
}

function downloadAudio(url) {
    let params = {
        headers: { 'Accept': 'audio/wav' },
        responseType: 'binary',
        tags: { operation: "sync", action: "download" }
    };
    let request = http.get(url, params);

    check(request, {
        "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
    }, { operation: "sync" });

    return request.body;
}

export function testSyncAudio(message, model, expected, extraTime = 0) {
    let audioUrl = generateAudioAndValidateResponse(message, model, extraTime);
    if (audioUrl === null) {
        return false;
    }

    let audio = downloadAudio(audioUrl);
    let audioLength = audio.byteLength;

    // console.log(`message: ${message} length: ${audioLength}, expected: ${expected}`);
    let success = check(audioLength, {
        "Length of audio matches": (h) => h === expected,
    }, { operation: "sync", message: message, model: model });

    return success;
}