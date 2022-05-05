import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js";

export const checkTextList = {
    "Response code of 200 (healthy)": (r) => r.status === 200,
    "Response has data field": (r) => _.has(r.json(), 'data'),
    "Response has size field": (r) => _.has(r.json(), 'size'),
    "Response has start field": (r) => _.has(r.json(), 'start'),
    "Response has _links field": (r) => _.has(r.json(), '_links'),
    "Response data is an array": (r) => _.isArray(r.json().data),
    "Response data is not empty": (r) => r.json().data.length > 0,
    "Every element is an object": (r) => _.every(r.json().data, _.isObject),
    "Every element has an id": (r) => _.every(r.json().data, (o) => _.has(o, 'id')),
    "Every element has a message": (r) => _.every(r.json().data, (o) => _.has(o, 'message')),
    "Every element has an operation": (r) => _.every(r.json().data, (o) => _.has(o, 'operation')),
    "Every element has a model": (r) => _.every(r.json().data, (o) => _.has(o, 'model')),
    "Every element has a created_at": (r) => _.every(r.json().data, (o) => _.has(o, 'created_at')),
    "Every element has a processed_at": (r) => _.every(r.json().data, (o) => _.has(o, 'processed_at')),
    "Every element has a status": (r) => _.every(r.json().data, (o) => _.has(o, 'status')),
    "Every element has a resource": (r) => _.every(r.json().data, (o) => _.has(o, 'resource')),
};

export const checkText = {
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
