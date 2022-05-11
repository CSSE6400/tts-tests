import http from "k6/http";
import { group, check } from "k6";
import { Rate } from "k6/metrics";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;
const url = BASE_URL + `/text`;

export const options = {
    tags: {
        test: "conformance",
    },
};

const conformance = new Rate("conformance");

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
            let params = {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                tags: { endpoint: "/text:POST" }
            };
            let request = http.post(url, JSON.stringify(body), params);

            let success = check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            }, { endpoint: "/text:POST" });
            conformance.add(success, { endpoint: "/text:POST" });
        });

        group("Invalid body fields", () => {
            let body = {
                "text": "Hello, world!",
                "voice": "tts_models.en.ljspeech.glow-tts",
                "operation": "SYNC"
            };
            let params = {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                tags: { endpoint: "/text:POST" }
            };
            let request = http.post(url, JSON.stringify(body), params);

            let success = check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            }, { endpoint: "/text:POST" });
            conformance.add(success, { endpoint: "/text:POST" });
        });

        group("Invalid model", () => {
            let body = {
                "message": "Hello, world!",
                "model": "en-US_AllisonVoice",
                "operation": "SYNC",
            };
            let params = {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                tags: { endpoint: "/text:POST" }
            };
            let request = http.post(url, JSON.stringify(body), params);

            let success = check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            }, { endpoint: "/text:POST" });
            conformance.add(success, { endpoint: "/text:POST" });
        });

        group("Invalid operation", () => {
            let body = {
                "message": "Hello, world!",
                "model": "tts_models.en.ljspeech.glow-tts",
                "operation": "FAST"
            };
            let params = {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                tags: { endpoint: "/text:POST" }
            };
            let request = http.post(url, JSON.stringify(body), params);

            let success = check(request, {
                "Response code of 400 (bad request)": (r) => r.status === 400
            }, { endpoint: "/text:POST" });
            conformance.add(success, { endpoint: "/text:POST" });
        });

        group("ASYNC operation", () => {
            let body = {
                "message": "Hello, world!",
                "model": "tts_models.en.ljspeech.glow-tts",
                "operation": "ASYNC"
            };
            let params = {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                tags: { endpoint: "/text:POST" }
            };
            let request = http.post(url, JSON.stringify(body), params);

            let bodyValidation = {
                // check request body is in response body
                "Response body contains message": (r) => r.json().message === body.message,
                "Response body contains model": (r) => r.json().model === body.model,
                "Response body contains operation": (r) => r.json().operation === body.operation,
            }

            let success = check(request, Object.assign(bodyValidation, validateText()), { endpoint: "/text:POST" });
            conformance.add(success, { endpoint: "/text:POST" });
        });

        group("SYNC operation", () => {
            let body = {
                "message": "Hello, world!",
                "model": "tts_models.en.ljspeech.glow-tts",
                "operation": "SYNC"
            };
            let params = {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                tags: { endpoint: "/text:POST" }
            };
            let request = http.post(url, JSON.stringify(body), params);

            let bodyValidation = {
                // check request body is in response body
                "Response body contains message": (r) => r.json().message === body.message,
                "Response body contains model": (r) => r.json().model === body.model,
                "Response body contains operation": (r) => r.json().operation === body.operation,

                // for sync: is not processing
                "Response body status is not PENDING": (r) => r.json().status !== "PENDING",
            }

            let success = check(request, Object.assign(bodyValidation, validateText()), { endpoint: "/text:POST" });
            conformance.add(success, { endpoint: "/text:POST" });
        });
    });

    group("GET /text", () => {
        let start = '0';
        let limit = '10';

        {
            let url = BASE_URL + `/text?start=${start}&limit=${limit}`;
            let request = http.get(url, { tags: { endpoint: "/text:GET" } });

            let responseSuccess = check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200,
                "Response has data field": (r) => _.has(r.json(), 'data'),
                "Response has size field": (r) => _.has(r.json(), 'size'),
                "Response has start field": (r) => _.has(r.json(), 'start'),
                "Response has _links field": (r) => _.has(r.json(), '_links'),
            }, { endpoint: "/text:GET" });

            let links = request.json()._links;
            let linksSuccess = check(links, {
                "Response has next link": (r) => _.has(r, 'next'),
                "Response has prev link": (r) => _.has(r, 'prev'),
                "Next link starts with /text?start=": (r) => r.next === null || r.next.startsWith(`${BASE_URL}/text?start=`),
                "Prev link starts with /text?start=": (r) => r.prev === null || r.prev.startsWith(`${BASE_URL}/text?start=`),
            }, { endpoint: "/text:GET" });


            let data = request.json().data;
            // check all the elements in the response
            let dataSuccess = check(request, {
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
            }, { endpoint: "/text:GET" });

            conformance.add(responseSuccess, { endpoint: "/text:GET" });
            conformance.add(linksSuccess, { endpoint: "/text:GET" });
            conformance.add(dataSuccess, { endpoint: "/text:GET" });
        }
    });

    group("GET /text/{id}", () => {
        group("Unknown id", () => {
            let id = "123456789012345678901234567890123456789012345678901234567890123";
            let url = BASE_URL + `/text/${id}`;
            let request = http.get(url, { tags: { endpoint: "/text:GET" } });

            let success = check(request, {
                "Response code of 404 (not found)": (r) => r.status === 404
            }, { endpoint: "/text/{id}:GET" });
            conformance.add(success, { endpoint: "/text/{id}:GET" });
        });

        group("Get the first text in list", () => {
            // get ID from /text endpoint
            let list_request = http.get(BASE_URL + `/text`, { tags: { endpoint: "/text:GET" } });
            let id = list_request.json().data[0].id;

            let url = BASE_URL + `/text/${id}`;
            let request = http.get(url, { tags: { endpoint: "/text/{id}:GET" } });

            let success = check(request, validateText(), { endpoint: "/text/{id}:GET" });
            conformance.add(success, { endpoint: "/text/{id}:GET" });
        });
    });

    group("DELETE /text/{id}", () => {
        group("Unknown id", () => {
            let id = "123456789012345678901234567890123456789012345678901234567890123";
            let url = BASE_URL + `/text/${id}`;
            let request = http.del(url, { tags: { endpoint: "/text/{id}:DELETE" } });

            let success = check(request, {
                "Response code of 404 (not found)": (r) => r.status === 404
            }, { endpoint: "/text/{id}:DELETE" });
            conformance.add(success, { endpoint: "/text/{id}:DELETE" });
        });

        group("Delete first text in list", () => {
            // get ID from /text endpoint
            let list_request = http.get(BASE_URL + `/text`, { tags: { endpoint: "/text:GET" } });
            let id = list_request.json().data[0].id;

            let url = BASE_URL + `/text/${id}`;
            let request = http.del(url, { tags: { endpoint: "/text/{id}:DELETE" } });

            let success = check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200
            }, { endpoint: "/text/{id}:DELETE" });
            conformance.add(success, { endpoint: "/text/{id}:DELETE" });

            // check /text endpoint returns 404
            let url2 = BASE_URL + `/text/${id}`;
            let request2 = http.get(url2, { tags: { endpoint: "/text/{id}:GET" } });

            success = check(request2, {
                "Response code of 404 (not found) after deleting": (r) => r.status === 404
            }, { endpoint: "/text/{id}:DELETE" });
            conformance.add(success, { endpoint: "/text/{id}:DELETE" });
        });
    });
}