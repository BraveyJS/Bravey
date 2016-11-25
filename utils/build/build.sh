#!/bin/bash
node build.js --include bravey --include extras --beautify
node build.js --include bravey --build --output ../../build/bravey.js
node build.js --include bravey --minify --build --output ../../build/bravey.min.js
