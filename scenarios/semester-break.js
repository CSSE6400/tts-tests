import http from 'k6/http';
import { check, sleep } from 'k6';

const ENDPOINT = __ENV.ENDPOINT;
const SAMPLE_ID = __ENV.SAMPLE_ID;

export const options = {
    stages: [
        { duration: '30s', target: 40 },
        { duration: '5m', target: 300 },
        { duration: '10m', target: 1000 },
        { duration: '10m', target: 1000 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
    ],
}

export default function() {
    const res = http.get(ENDPOINT + '/api/v1/text/' + SAMPLE_ID);

    check(res, {
        'data recieved': (r) => r.status === 200 && r.json().data.message === "hello",
    });

    sleep(1);
}
