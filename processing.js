import testSync from './processing/test-sync.js';
import testAsync from './processing/test-async.js';

export const options = {
    tags: {
        test: "processing",
    },
};

export default function() {
    testSync();
    testAsync();
}