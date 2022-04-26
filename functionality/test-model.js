import http from "k6/http";
import { group, check } from "k6";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

const ENDPOINT = __ENV.ENDPOINT;
const BASE_URL = ENDPOINT;

const createEk1TacoTron = () => ({
    name: 'tts_models.en.ek1.tacotron2',
    description: 'EK1 en-rp tacotron2 by NMStoker',
    author: '',
    license: '',
    url: 'https://coqui.gateway.scarf.sh/v0.1.0/tts_models--en--ek1--tacotron2.zip',
});

const createLJTacoTron = () => ({
    name: 'tts_models.en.ljspeech.tacotron2-DDC',
    description: 'Tacotron2 with Double Decoder Consistency.',
    author: 'Eren Gölge @erogol',
    license: 'MIT',
    url: 'https://coqui.gateway.scarf.sh/v0.0.12/tts_models--en--ljspeech--tacotron2-DDC.zip',
});

const createLJGlowTts = () => ({
    name: 'tts_models.en.ljspeech.glow-tts',
    description: '',
    author: 'Eren Gölge @erogol',
    license: 'MPL',
    url: 'https://coqui.gateway.scarf.sh/v0.0.9/tts_models--en--ljspeech--glow-tts.zip',
});

const createLJFastPitch = () => ({
    name: 'tts_models.en.ljspeech.fast_pitch',
    description: 'FastPitch model trained on LJSpeech using the Aligner Network',
    author: 'Eren Gölge @erogol',
    license: 'TBD',
    url: 'https://coqui.gateway.scarf.sh/v0.2.2/tts_models--en--ljspeech--fast_pitch.zip',
});

export default function() {

    group("/model", () => {
        {
            let url = BASE_URL + `/model`;
            let request = http.get(url);

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200,
                "Array of at least 4 elements returned": (r) => r.json().length >= 4,
                "All elements are strings": (r) => _.every(r.json(), (e) => typeof e === 'string'),
                "One element is 'tts_models.en.ek1.tacotron2'": (r) => _.includes(r.json(), 'tts_models.en.ek1.tacotron2'),
                "One element is 'tts_models.en.ljspeech.tacotron2-DDC'": (r) => _.includes(r.json(), 'tts_models.en.ljspeech.tacotron2-DDC'),
                "One element is 'tts_models.en.ljspeech.glow-tts'": (r) => _.includes(r.json(), 'tts_models.en.ljspeech.glow-tts'),
                "One element is 'tts_models.en.ljspeech.fast_pitch'": (r) => _.includes(r.json(), 'tts_models.en.ljspeech.fast_pitch'),
                "All elements are unique": (r) => _.uniq(r.json()).length === r.json().length,
            });
        }
    });

    group("/model/{id}", () => {
        group("test tts_models.en.ek1.tacotron2 response", () => {
            let id = 'tts_models.en.ek1.tacotron2';

            let url = BASE_URL + `/model/${id}`;
            let request = http.get(url);

            let expected = createEk1TacoTron();

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200
            });

            check(request, {
                "Response is an object": (r) => _.isObject(r.json())
            });

            // check contents of model
            check(request, {
                "Correct response": (r) => _.isEqual(r.json(), expected)
            });
        });

        group("test tts_models.en.ljspeech.tacotron2-DDC response", () => {
            let id = 'tts_models.en.ljspeech.tacotron2-DDC';

            let url = BASE_URL + `/model/${id}`;
            let request = http.get(url);

            let expected = createLJTacoTron();

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200
            });

            check(request, {
                "Response is an object": (r) => _.isObject(r.json())
            });

            // check contents of model
            check(request, {
                "Correct response": (r) => _.isEqual(r.json(), expected)
            });
        });

        group("test tts_models.en.ljspeech.glow-tts response", () => {
            let id = 'tts_models.en.ljspeech.glow-tts';

            let url = BASE_URL + `/model/${id}`;
            let request = http.get(url);

            let expected = createLJGlowTts();

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200
            });

            check(request, {
                "Response is an object": (r) => _.isObject(r.json())
            });

            // check contents of model
            check(request, {
                "Correct response": (r) => _.isEqual(r.json(), expected)
            });
        });

        group("test tts_models.en.ljspeech.fast_pitch response", () => {
            let id = 'tts_models.en.ljspeech.fast_pitch';

            let url = BASE_URL + `/model/${id}`;
            let request = http.get(url);

            let expected = createLJFastPitch();

            check(request, {
                "Response code of 200 (healthy)": (r) => r.status === 200
            });

            check(request, {
                "Response is an object": (r) => _.isObject(r.json())
            });

            // check contents of model
            check(request, {
                "Correct response": (r) => _.isEqual(r.json(), expected)
            });
        });

        group("test unknown model response", () => {
            let id = 'tts_models.en.unknown';

            let url = BASE_URL + `/model/${id}`;
            let request = http.get(url);

            check(request, {
                "Response code of 404 (not found)": (r) => r.status === 404
            });
        });
    });

}