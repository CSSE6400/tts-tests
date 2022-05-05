import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

export const checkModelList = {
    "Response code of 200 (healthy)": (r) => r.status === 200,
    "Array of at least 4 elements returned": (r) => r.json().length >= 4,
    "All elements are strings": (r) => _.every(r.json(), (e) => typeof e === 'string'),
    "One element is 'tts_models.en.ek1.tacotron2'": (r) => _.includes(r.json(), 'tts_models.en.ek1.tacotron2'),
    "One element is 'tts_models.en.ljspeech.tacotron2-DDC'": (r) => _.includes(r.json(), 'tts_models.en.ljspeech.tacotron2-DDC'),
    "One element is 'tts_models.en.ljspeech.glow-tts'": (r) => _.includes(r.json(), 'tts_models.en.ljspeech.glow-tts'),
    "One element is 'tts_models.en.ljspeech.fast_pitch'": (r) => _.includes(r.json(), 'tts_models.en.ljspeech.fast_pitch'),
    "All elements are unique": (r) => _.uniq(r.json()).length === r.json().length,
};

export const checkModel = {
    "Response code of 200 (healthy)": (r) => r.status === 200,
    "Response is an object": (r) => _.isObject(r.json()),
    "Response has name field": (r) => _.has(r.json(), 'name'),
    "Response has description field": (r) => _.has(r.json(), 'description'),
    "Response has author field": (r) => _.has(r.json(), 'author'),
    "Response has license field": (r) => _.has(r.json(), 'license'),
    "Response has url field": (r) => _.has(r.json(), 'url'),
};