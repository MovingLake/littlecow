#!/bin/bash

echo "$#"
mode="production"
if [[ $# == 0 ]]; then
    mode="development"
    echo "$mode"
elif [[ $# > 0 ]]; then
    mode=$1
    echo "$1"
fi

# First we need to check if the directory
# compressed exists. If it does, we need to
# remove it.
if [ -d compressed ]; then
    rm -rf compressed compressed.zip
fi

# Now we need to create the directory
# compressed
mkdir compressed

# Let's uglify all the files in the current
# directory
for file in $(find . -type f -maxdepth 1 -name '*.js' -o -name '*.css'); do
    uglifyjs $file -o compressed/$file
    uglifycss $file -o compressed/$file
done

cp -R assets compressed/assets
cp manifest.json compressed/manifest.json
cp *.css compressed
cp *.html compressed

if [[ "$mode" == "production" ]]; then
    echo "Compressing files for production"
else
    echo "Compressing files for development"
    sed -i '' 's|https://connector\.production\.movinglake\.com|http://localhost:8000|g' compressed/contentscript.js
fi

# Compresses all files in the current directory
# and places them in a new directory called
# compressed
zip -r compressed compressed/*

# Done!
echo "Done!"
