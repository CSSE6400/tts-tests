import http from "k6/http";
import { group, check } from "k6";
import { Rate } from "k6/metrics";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;
const url = BASE_URL + `/text`;

const DEFAULT_TIMEOUT = 120;

const processing = new Rate("processing");

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

    let failed = !check(request, {
        "Response code of post request is 200 (healthy)": (r) => r.status === 200,
        "Status field is 'COMPLETED'": (r) => r.json().status === "COMPLETED",
        "Resource field is a string": (r) => _.isString(r.json().resource),
    }, { operation: "sync" });
    if (failed) {
        return null;
    }

    return request.json().resource;
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

function testSyncAudio(message, model, expected, extraTime = 0) {
    let audioUrl = generateAudioAndValidateResponse(message, model, extraTime);
    if (audioUrl === null) {
        processing.add(0, { operation: "sync", message: message, model: model });
        return false;
    }

    let audio = downloadAudio(audioUrl);
    let audioLength = audio.byteLength;

    // console.log(`message: ${message} length: ${audioLength}, expected: ${expected}`);
    let success = check(audioLength, {
        "Length of audio matches": (h) => h === expected,
    }, { operation: "sync", message: message, model: model });
    processing.add(success, { operation: "sync", message: message, model: model });
}

export default function() {
    group("Test sync", () => {
        group("Generate 'Hello CSSE6400'", () => {
            testSyncAudio(
                "Hello CSSE6400",
                "tts_models.en.ljspeech.glow-tts",
                83532
            );
        });

        group("Generate 'Roads? Where we're going, we don't need roads!'", () => {
            testSyncAudio(
                "Roads? Where we're going, we don't need roads!",
                "tts_models.en.ljspeech.fast_pitch",
                137292
            );
        });

        group("Generate 'To thine own self be true'", () => {
            testSyncAudio(
                "To thine own self be true",
                "tts_models.en.ljspeech.fast_pitch",
                100940
            );
        });

        group("Generate 'Toto, I've a feeling we're not in Kansas anymore'", () => {
            testSyncAudio(
                "Toto, I've a feeling we're not in Kansas anymore",
                "tts_models.en.ljspeech.glow-tts",
                170572
            );
        });

        group("Generate 'I'm going to make him an offer he can't refuse'", () => {
            testSyncAudio(
                "I'm going to make him an offer he can't refuse",
                "tts_models.en.ljspeech.fast_pitch",
                149580
            );
        });
    });
}