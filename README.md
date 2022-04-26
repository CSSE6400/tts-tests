# tts-tests

Tests for the chatterbox text-to-speech service.

## Requirements
The only requirements are a unix terminal and [k6](https://k6.io/).

## Running
To run the tests:

1. Checkout the repository locally.
```
git clone https://github.com/CSSE6400/tts-tests
```
2. Enter the repository directory.
```
cd tts-tests
```
3. Run the `run.sh` script with your endpoint URL.
```
./run [your-endpoint]
```

## Types of tests
1. API Conformance (30%)
2. Functional Coversion (20%)
3. Scale testing (50%)

Thus far, only API conformance testing is available.
