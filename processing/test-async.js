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

const processing = new Rate("processing");

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
    let params = {
        headers: { 'Accept': 'audio/wav' },
        responseType: 'binary',
        tags: { operation: "async", action: "download" }
    };
    let request = http.get(url, params);

    check(request, {
        "Response code of resource link is 200 (healthy)": (r) => r.status === 200,
    }, { operation: "async" });

    return request.body;
}

function pollForAudio(requestID) {
    let audioUrl = `${url}/${requestID}`;
    let params = {
        headers: { 'Accept': 'application/json' },
        tags: { operation: "async", action: "poll" }
    };
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

function testAsyncAudio(message, model, expected, label = null) {
    if (label === null) {
        label = message;
    }
    let requestID = requestAudioGeneration(message, model);
    if (requestID === null) {
        processing.add(0, { operation: "async", message: label, model: model });
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
                processing.add(0, { operation: "async", message: label, model: model });
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
    }, { operation: "async", message: label, model: model });
    processing.add(success, { operation: "async", message: label, model: model });
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
const LARGE = open("gulliver-trimmed.txt");

function dontCrash(fn) {
    return (...args) => {
        try {
            return fn(...args);
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }
}

export default function() {
    group("Test async small", () => {
        group("Generate 'Hello CSSE6400'", dontCrash(() => {
            testAsyncAudio(
                "Hello CSSE6400",
                "tts_models.en.ljspeech.glow-tts",
                83532
            );
        }));

        group("Generate 'Roads? Where we're going, we don't need roads!'", dontCrash(() => {
            testAsyncAudio(
                "Roads? Where we're going, we don't need roads!",
                "tts_models.en.ljspeech.fast_pitch",
                137292
            );
        }));

        group("Generate 'To thine own self be true'", dontCrash(() => {
            testAsyncAudio(
                "To thine own self be true",
                "tts_models.en.ljspeech.fast_pitch",
                100940
            );
        }));

        group("Generate 'Toto, I've a feeling we're not in Kansas anymore'", dontCrash(() => {
            testAsyncAudio(
                "Toto, I've a feeling we're not in Kansas anymore",
                "tts_models.en.ljspeech.glow-tts",
                170572
            );
        }));

        group("Generate 'I'm going to make him an offer he can't refuse'", dontCrash(() => {
            testAsyncAudio(
                "I'm going to make him an offer he can't refuse",
                "tts_models.en.ljspeech.fast_pitch",
                149580
            );
        }));
    });

    group("Test async large", () => {
        group("Generate A Tale of Two Cities", dontCrash(() => {
            testAsyncAudio(
                MESSAGES["Dickens"],
                "tts_models.en.ljspeech.glow-tts",
                1795660,
                "A Tale of Two Cities"
            );
        }));

        group("Generate Pride and Prejudice", dontCrash(() => {
            testAsyncAudio(
                MESSAGES["Austen"],
                "tts_models.en.ljspeech.fast_pitch",
                941676,
                "Pride and Prejudice"
            )
        }));

        group("Generate Haunting of Hill House", dontCrash(() => {
            testAsyncAudio(
                MESSAGES["HillHouse"],
                "tts_models.en.ljspeech.glow-tts",
                1591948,
                "Haunting of Hill House"
            )
        }));

        group("Generate Hamlet", dontCrash(() => {
            testAsyncAudio(
                MESSAGES["Shakespeare"],
                "tts_models.en.ljspeech.fast_pitch",
                1525388,
                "Hamlet"
            )
        }));

        group("Generate The Body", dontCrash(() => {
            testAsyncAudio(
                MESSAGES["King"],
                "tts_models.en.ljspeech.glow-tts",
                2141420,
                "The Body"
            )
        }));

        group("Generate The Great Gatsby", dontCrash(() => {
            testAsyncAudio(
                MESSAGES["Fitzgerald"],
                "tts_models.en.ljspeech.fast_pitch",
                1151628,
                "The Great Gatsby"
            )
        }));
    });

    group("Test async extra large", dontCrash(() => {
        testAsyncAudio(
            LARGE,
            "tts_models.en.ljspeech.glow-tts",
            26393004,
            "Gullivers Travels"
        );
    }));
}