import http from "k6/http";
import { group, check, fail, sleep } from "k6";
import crypto from "k6/crypto";
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
        timeout: `${timeout}s`
    };
    let request = http.post(url, JSON.stringify(body), params);

    let failed = !check(request, {
        "Response code of post request is 200 (healthy)": (r) => r.status === 200,
        "Response has an id field": (r) => r.json().id,
    });
    if (failed) {
        return null;
    }

    return request.json().id;
}

function downloadAudio(url) {
    let params = { headers: { 'Accept': 'audio/wav' }, responseType: 'binary' };
    let request = http.get(url, params);

    check(request, {
        "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
    });

    return request.body;
}

function pollForAudio(requestID) {
    let audioUrl = `${url}/${requestID}`;
    let params = { headers: { 'Accept': 'application/json' } };
    let request = http.get(audioUrl, params);

    let ready = request.json().status === "COMPLETED";
    if (ready) {
        check(request, {
            "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
            "Status field is 'COMPLETED'": (r) => r.json().status === "COMPLETED",
            "Resource field is a string": (r) => _.isString(r.json().resource),
        });
        return request.json().resource;
    }

    return null;
}

function testAsyncAudio(message, model, hash) {
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
    let audioHash = crypto.md5(audio, "hex");

    // console.log(`message: ${message} hash: ${audioHash}, expected: ${hash}`);
    check(audioHash, {
        "MD5 hash of audio matches": (h) => h === hash,
    });
}

const MESSAGES = {
    "Dickens": "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way — in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.",
    "Austen": "It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.",
    "HillHouse": "No live organism can continue for long to exist sanely under conditions of absolute reality; even larks and katydids are supposed, by some, to dream. Hill House, not sane, stood by itself against its hills, holding darkness within; it had stood so for eighty years and might stand for eighty more. Within, walls continued upright, bricks met neatly, floors were firm, and doors were sensibly shut; silence lay steadily against the wood and stone of Hill House, and whatever walked there, walked alone...",
    "Shakespeare": "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them? To die: to sleep; No more; and by a sleep to say we end the heartache, and the thousand natural shocks that flesh is heir to. To sleep: perchance to dream: ay, there's the rub; For in that sleep of death what dreams may come, when we have shuffled off this mortal coil, must give us pause. To wake: -- that is the beginning of eternity; and the end is near; -- 'Tis the while -- and that's all the while.",
    "King": "The most important things are the hardest to say. They are the things you get ashamed of, because words diminish them — words shrink things that seemed limitless when they were in your head to no more than living size when they're brought out. But it's more than that, isn't it? The most important things lie too close to wherever your secret heart is buried, like landmarks to a treasure your enemies would love to steal away. And you may make revelations that cost you dearly only to have people look at you in a funny way, not understanding what you've said at all, or why you thought it was so important that you almost cried while you were saying it. That's the worst, I think. When the secret stays locked within not for want of a teller but for want of an understanding ear.",
    "Fitzgerald": "In my younger and more vulnerable years my father gave me some advice that I\"ve been turning over in my mind ever since. \"Whenever you feel like criticizing any one,\" he told me, \"just remember that all the people in this world haven't had the advantages that you've had.\" He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that."
};

// load a very large message from a file
const LARGE = open("gulliver.txt");

export default function() {
    group("Test async small", () => {
        group("Generate 'Hello CSSE6400'", () => {
            testAsyncAudio(
                "Hello CSSE6400",
                "tts_models.en.ljspeech.glow-tts",
                "f8496799263bee55b309a6a395c1c99b"
            );
        });

        group("Generate 'Roads? Where we're going, we don't need roads!'", () => {
            testAsyncAudio(
                "Roads? Where we're going, we don't need roads!",
                "tts_models.en.ljspeech.fast_pitch",
                "0af94c710cc4aa047ecb11a12b65ad03"
            );
        });

        group("Generate 'I'll be back'", () => {
            testAsyncAudio(
                "I'll be back",
                "tts_models.en.ljspeech.glow-tts",
                "b28e82944a43145949aba0be2a34d97b"
            );
        });

        group("Generate 'To thine own self be true'", () => {
            testAsyncAudio(
                "To thine own self be true",
                "tts_models.en.ljspeech.fast_pitch",
                "2e7c6679812b08385ec604dfef6b6e59"
            );
        });

        group("Generate 'Toto, I've a feeling we're not in Kansas anymore'", () => {
            testAsyncAudio(
                "Toto, I've a feeling we're not in Kansas anymore",
                "tts_models.en.ljspeech.glow-tts",
                "a8b94bc1eb5c0e2972645ecb1df2ff9e"
            );
        });

        group("Generate 'I'm going to make him an offer he can't refuse'", () => {
            testAsyncAudio(
                "I'm going to make him an offer he can't refuse",
                "tts_models.en.ljspeech.fast_pitch",
                "daabd59a835effd87adfee0b20aa720b"
            );
        });

        group("Generate 'Bond. James Bond'", () => {
            testAsyncAudio(
                "Bond. James Bond",
                "tts_models.en.ljspeech.glow-tts",
                "aa1828981026691ad4828e526e8bfad2",
            );
        });

        group("Generate 'May the Force be with you'", () => {
            testAsyncAudio(
                "May the Force be with you",
                "tts_models.en.ljspeech.fast_pitch",
                "b579f547260e9a38d338877c4cda98ab"
            );
        });
    });

    group("Test async large", () => {
        group("Generate A Tale of Two Cities", () => {
            testAsyncAudio(
                MESSAGES["Dickens"],
                "tts_models.en.ljspeech.glow-tts",
                "9b4227c23cd041bc3eafec3624e3d004"
            );
        });

        group("Generate Pride and Prejudice", () => {
            testAsyncAudio(
                MESSAGES["Austen"],
                "tts_models.en.ljspeech.fast_pitch",
                "091dad252bf5948ad8d48ff99b39c3ef"
            )
        });

        group("Generate Haunting of Hill House", () => {
            testAsyncAudio(
                MESSAGES["HillHouse"],
                "tts_models.en.ljspeech.glow-tts",
                "a0a5206b7993ebfe6d3a6153d5862a06"
            )
        });

        group("Generate Hamlet", () => {
            testAsyncAudio(
                MESSAGES["Shakespeare"],
                "tts_models.en.ljspeech.fast_pitch",
                "430693e892e07baeb93637c997c91bda"
            )
        });

        group("Generate The Body", () => {
            testAsyncAudio(
                MESSAGES["King"],
                "tts_models.en.ljspeech.glow-tts",
                "5255c67497ced8cbfd7a598288a6917f"
            )
        });

        group("Generate The Great Gatsby", () => {
            testAsyncAudio(
                MESSAGES["Fitzgerald"],
                "tts_models.en.ljspeech.fast_pitch",
                "68883081f1429018842bc784ed80ffc2"
            )
        });
    });

    group("Test async extra large", () => {
        testAsyncAudio(
            LARGE,
            "tts_models.en.ljspeech.glow-tts",
            "7c8abb0029cdb0c4b56c7fcb6c4361ff"
        );
    });
}