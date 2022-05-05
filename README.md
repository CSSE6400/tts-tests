# tts-tests

Tests for the chatterbox text-to-speech service.

## Requirements
The only requirements are a unix terminal and [k6](https://k6.io/).
For visualization, docker-compose will be required.

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

## Running with visualization
To run the tests with visualization:

1. Checkout the repository locally.
```
git clone https://github.com/CSSE6400/tts-tests
```
2. Enter the repository directory.
```
cd tts-tests
```
3. Start the visualization interface.
```
cd dashboard && docker-compose up
```
4. Navigate to the visualization interface: http://localhost:6400/d/k6/k6-load-testing-results
4. Open a new terminal and enter the repository directory.
```
cd tts-tests
```
6. Run the `run.sh` script with your endpoint URL with the `-l` log flag
```
./run [your-endpoint] -l
```

## Types of tests
1. API Conformance (30%)
2. Text Processing (20%)
3. Scale testing (50%)

Thus far, only API conformance and text processing testing is available.
