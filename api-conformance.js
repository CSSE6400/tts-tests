import testHealth from './api-conformance/test-health.js';
import testModel from './api-conformance/test-model.js';
import testText from './api-conformance/test-text.js';

export default function() {
    testHealth();
    testModel();
    testText();
}