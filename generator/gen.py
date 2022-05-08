import os
import json
import subprocess

from faker import Faker

DATA = [
    ('course-material', 2500, 20), # should be 20
    ('monday-announcement', 80, 75), # should be 75
    ('reading-lists', 7000, 100), # should be 100
    ('revision-material', 3500, 30), # should be 30
]

for name, characters, generate_count in DATA:
    ten_percent = characters // 10
    max_ = characters
    min_ = characters - ten_percent

    sentences = characters // 28

    Faker.seed(0)
    fake = Faker()
    count = 0
    lines = []
    while True:
        paragraph = fake.paragraph(nb_sentences=sentences)
        if len(paragraph) > max_ or len(paragraph) < min_:
            continue

        print(len(paragraph))

        count += 1
        lines.append(paragraph)

        if count >= generate_count:
            break
        # print(fake.paragraph(nb_sentences=250))

    lines_and_size = []
    for i, line in enumerate(lines):
        with open(f'{name}.txt', 'w') as f:
            f.write(line)
        subprocess.run(
            f"chatterbox run --input-file {name}.txt --run-id {name}",
            shell=True, check=True)
        print(i)
        # get the size of the output wav file
        size = os.path.getsize(f'out/{name}.wav')
        lines_and_size.append((line, size))

    with open(f"data/{name}.json", "w") as f:
        json.dump(lines_and_size, f, indent=4)
