import testHealth from './functionality/test-health.js';
import testModel from './functionality/test-model.js';
import testText from './functionality/test-text.js';

export default function() {
    testHealth();
    testModel();
    testText();
}