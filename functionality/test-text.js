import http from "k6/http";
import { group, check } from "k6";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;
const url = BASE_URL + `/text`;

function validateText() {
    return {
        "Response code of 200 (healthy)": (r) => r.status === 200,
        "Response is an object": (r) => _.isObject(r.json()),
        // check response fields are present
        "Response body contains id": (r) => _.has(r.json(), 'id'),
        "Response body contains status": (r) => _.has(r.json(), 'status'),
        "Response body contains created_at": (r) => _.has(r.json(), 'created_at'),
        "Response body contains processed_at": (r) => _.has(r.json(), 'processed_at'),
        "Response body contains resource": (r) => _.has(r.json(), 'resource'),
        // check response fields are type correct
        "Response body id is a string": (r) => _.isString(r.json().id),
        "Response body status is a string": (r) => _.isString(r.json().status),
        "Response body created_at is a string": (r) => _.isString(r.json().created_at),
        // check created at day is today
        "Response body created_at is today": (r) => r.json().created_at.includes(new Date().toISOString().substring(0, 10)),
        // check status is either "PENDING", "COMPLETED", or "FAILED"
        "Response body status is PENDING, COMPLETED, or FAILED": (r) => r.json().status === "PENDING" || r.json().status === "COMPLETED" || r.json().status === "FAILED",
        // check if status is "COMPLETED" then resource is a string
        "Response body status is COMPLETED then resource is a string": (r) => r.json().status !== "COMPLETED" || _.isString(r.json().resource),
    };
}

export default function() {
    group("POST /text", () => {
        group("Empty body", () => {
            let body = {};
            let params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
            let request = http.post(url, JSON.stringify(body), params);

            check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            });
        });

        group("Invalid body fields", () => {
            let body = {
                "text": "Hello, world!",
                "voice": "tts_models.en.ljspeech.glow-tts",
                "operation": "SYNC"
            };
            let params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
            let request = http.post(url, JSON.stringify(body), params);

            check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            });
        });

        group("Invalid model", () => {
            let body = {
                "message": "Hello, world!",
                "model": "en-US_AllisonVoice",
                "operation": "SYNC",
            };
            let params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
            let request = http.post(url, JSON.stringify(body), params);

            check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            });
        });

        group("Invalid operation", () => {
            let body = {
                "message": "Hello, world!",
                "model": "tts_models.en.ljspeech.glow-tts",
                "operation": "FAST"
            };
            let params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
            let request = http.post(url, JSON.stringify(body), params);

            check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            });
        });

        group("ASYNC operation", () => {
            let body = {
                "message": "Hello, world!",
                "model": "tts_models.en.ljspeech.glow-tts",
                "operation": "ASYNC"
            };
            let params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
            let request = http.post(url, JSON.stringify(body), params);

            let bodyValidation = {
                // check request body is in response body
                "Response body contains message": (r) => r.json().message === body.message,
                "Response body contains model": (r) => r.json().model === body.model,
                "Response body contains operation": (r) => r.json().operation === body.operation,
            }

            check(request, Object.assign(bodyValidation, validateText()));
        });

        group("SYNC operation", () => {
            let body = {
                "message": "Hello, world!",
                "model": "tts_models.en.ljspeech.glow-tts",
                "operation": "SYNC"
            };
            let params = { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
            let request = http.post(url, JSON.stringify(body), params);

            let bodyValidation = {
                // check request body is in response body
                "Response body contains message": (r) => r.json().message === body.message,
                "Response body contains model": (r) => r.json().model === body.model,
                "Response body contains operation": (r) => r.json().operation === body.operation,

                // for sync: is not processing
                "Response body status is not PENDING": (r) => r.json().status !== "PENDING",
            }

            check(request, Object.assign(bodyValidation, validateText()));
        });
    });

    group("GET /text", () => {
        let start = '0';
        let limit = '10';

        {
            let url = BASE_URL + `/text?start=${start}&limit=${limit}`;
            let request = http.get(url);

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200,
                "Response has data field": (r) => _.has(r.json(), 'data'),
                "Response has size field": (r) => _.has(r.json(), 'size'),
                "Response has start field": (r) => _.has(r.json(), 'start'),
                "Response has _links field": (r) => _.has(r.json(), '_links'),
            });

            let links = request.json()._links;
            check(links, {
                "Response has next link": (r) => _.has(r, 'next'),
                "Response has prev link": (r) => _.has(r, 'prev'),
                "Next link starts with /text?start=": (r) => r.next === null || r.next.startsWith(`${BASE_URL}/text?start=`),
                "Prev link starts with /text?start=": (r) => r.prev === null || r.prev.startsWith(`${BASE_URL}/text?start=`),

            });


            let data = request.json().data;
            // check all the elements in the response
            check(request, {
                "Response data is an array": (r) => _.isArray(data),
                "Response data is not empty": (r) => data.length > 0,
                "Response data is less than limit": (r) => data.length <= limit,
                "Every element is an object": (r) => _.every(data, _.isObject),
                "Every element has an id": (r) => _.every(data, (o) => _.has(o, 'id')),
                "Every element has a message": (r) => _.every(data, (o) => _.has(o, 'message')),
                "Every element has an operation": (r) => _.every(data, (o) => _.has(o, 'operation')),
                "Every element has a model": (r) => _.every(data, (o) => _.has(o, 'model')),
                "Every element has a created_at": (r) => _.every(data, (o) => _.has(o, 'created_at')),
                "Every element has a processed_at": (r) => _.every(data, (o) => _.has(o, 'processed_at')),
                "Every element has a status": (r) => _.every(data, (o) => _.has(o, 'status')),
                "Every element has a resource": (r) => _.every(data, (o) => _.has(o, 'resource')),
            });
        }
    });

    group("GET /text/{id}", () => {
        group("Unknown id", () => {
            let id = "123456789012345678901234567890123456789012345678901234567890123";
            let url = BASE_URL + `/text/${id}`;
            let request = http.get(url);

            check(request, {
                "Response code of 404 (not found)": (r) => r.status === 404
            });
        });

        group("Get the first text in list", () => {
            // get ID from /text endpoint
            let list_request = http.get(BASE_URL + `/text`);
            let id = list_request.json().data[0].id;

            let url = BASE_URL + `/text/${id}`;
            let request = http.get(url);

            check(request, validateText());
        });
    });

    group("DELETE /text/{id}/status", () => {
        group("Unknown id", () => {
            let id = "123456789012345678901234567890123456789012345678901234567890123";
            let url = BASE_URL + `/text/${id}`;
            let request = http.del(url);

            check(request, {
                "Response code of 404 (not found)": (r) => r.status === 404
            });
        });

        group("Delete first text in list", () => {
            // get ID from /text endpoint
            let list_request = http.get(BASE_URL + `/text`);
            let id = list_request.json().data[0].id;

            let url = BASE_URL + `/text/${id}`;
            let request = http.del(url);

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200
            });

            // check /text endpoint returns 404
            let url2 = BASE_URL + `/text/${id}`;
            let request2 = http.get(url2);

            check(request2, {
                "Response code of 404 (not found) after deleting": (r) => r.status === 404
            });
        });
    });
}