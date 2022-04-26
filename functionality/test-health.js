import http from "k6/http";
import { group, check } from "k6";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;

export default function() {
    group("/health", () => {
        {
            let url = BASE_URL + `/health`;
            let request = http.get(url);

            check(request, {
                "Service is healthy": (r) => r.status === 200
            });
        }

        // Can't really test 503
    });
}