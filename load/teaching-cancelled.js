import { Rate } from "k6/metrics";
import { testSyncAudio } from "./requests/sync.js";

const queries = new Rate("queries");
const mutations = new Rate("mutations");

export const options = {
    rps: 50,
    scenarios: {
        teacher: {
            executor: "shared-iterations", // should only ever have 1,957 uploads
            vus: 20,
            iterations: 1957,
            exec: 'sendAnnouncement',
            maxDuration: '1h',
        },
    },
    tags: {
        test: "load",
        Qscenario: "teaching-cancelled",
    },
    minIterationDuration: '5s'
};

export function sendAnnouncement() {
    let success = testSyncAudio(
        "Dear class, The university has decided to cancel all classes (both on-line and in-person) for the remainter fo the week. We will let you know about how these classes will be caught up when the university informs us further. Thank you for your patience and understanding.",
        "tts_models.en.ljspeech.glow-tts",
        804492
    );
    mutations.add(success, { endpoint: "/test", operation: "SYNC", label: "Send Announcement" });

    // Excellent, I've uploaded my stuff, home time!
}