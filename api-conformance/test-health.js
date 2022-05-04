import http from "k6/http";
import { group, check } from "k6";
import { Rate } from "k6/metrics";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;

const conformance = new Rate("conformance");

export default function() {
    group("/health", () => {
        {
            let url = BASE_URL + `/health`;
            let request = http.get(url, { tags: { endpoint: "/health", test: "conformance" } });

            let success = check(request, {
                "Service is healthy": (r) => r.status === 200
            }, {endpoint: "/health", test: "conformance"});
            conformance.add(success, {endpoint: "/health"});
        }

        // Can't really test 503
    });
}