import http from "k6/http";
import { group, check } from "k6";
import crypto from "k6/crypto";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;
const url = BASE_URL + `/text`;

const DEFAULT_TIMEOUT = 120;

function generateAudioAndValidateResponse(message, model, extraTime) {
    let body = {
        "message": message,
        "model": model,
        "operation": "SYNC"
    };
    let timeout = DEFAULT_TIMEOUT + (extraTime || 0);
    let params = {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: `${timeout}s`
    };
    let request = http.post(url, JSON.stringify(body), params);

    let failed = !check(request, {
        "Response code of post request is 200 (healthy)": (r) => r.status === 200,
        "Status field is 'COMPLETED'": (r) => r.json().status === "COMPLETED",
        "Resource field is a string": (r) => _.isString(r.json().resource),
    });
    if (failed) {
        return null;
    }

    return request.json().resource;
}

function downloadAudio(url) {
    let params = { headers: { 'Accept': 'audio/wav' }, responseType: 'binary' };
    let request = http.get(url, params);

    check(request, {
        "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
    });

    return request.body;
}

function testSyncAudio(message, model, hash, extraTime = 0) {
    let audioUrl = generateAudioAndValidateResponse(message, model, extraTime);
    if (audioUrl === null) {
        return;
    }

    let audio = downloadAudio(audioUrl);
    let audioHash = crypto.md5(audio, "hex");

    console.log(`message: ${message} hash: ${audioHash}, expected: ${hash}`);
    check(audioHash, {
        "MD5 hash of audio matches": (h) => h === hash,
    });
}

export default function() {
    group("Generate 'Hello CSSE6400'", () => {
        testSyncAudio(
            "Hello CSSE6400",
            "tts_models.en.ljspeech.glow-tts",
            "f8496799263bee55b309a6a395c1c99b"
        );
    });

    group("Generate 'Roads? Where we're going, we don't need roads!'", () => {
        testSyncAudio(
            "Roads? Where we're going, we don't need roads!",
            "tts_models.en.ljspeech.fast_pitch",
            "0af94c710cc4aa047ecb11a12b65ad03"
        );
    });

    group("Generate 'I'll be back'", () => {
        testSyncAudio(
            "I'll be back",
            "tts_models.en.ljspeech.glow-tts",
            "b28e82944a43145949aba0be2a34d97b"
        );
    });

    group("Generate 'To thine own self be true'", () => {
        testSyncAudio(
            "To thine own self be true",
            "tts_models.en.ljspeech.fast_pitch",
            "2e7c6679812b08385ec604dfef6b6e59"
        );
    });

    group("Generate 'Toto, I've a feeling we're not in Kansas anymore'", () => {
        testSyncAudio(
            "Toto, I've a feeling we're not in Kansas anymore",
            "tts_models.en.ljspeech.glow-tts",
            "a8b94bc1eb5c0e2972645ecb1df2ff9e"
        );
    });

    group("Generate 'I'm going to make him an offer he can't refuse'", () => {
        testSyncAudio(
            "I'm going to make him an offer he can't refuse",
            "tts_models.en.ljspeech.fast_pitch",
            "daabd59a835effd87adfee0b20aa720b"
        );
    });

    group("Generate 'Bond. James Bond'", () => {
        testSyncAudio(
            "Bond. James Bond",
            "tts_models.en.ljspeech.glow-tts",
            "aa1828981026691ad4828e526e8bfad2",
        );
    });

    group("Generate 'May the Force be with you'", () => {
        testSyncAudio(
            "May the Force be with you",
            "tts_models.en.ljspeech.fast_pitch",
            "b579f547260e9a38d338877c4cda98ab"
        );
    });
}