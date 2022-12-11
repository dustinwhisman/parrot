# Parrot

Because it repeats whatever you tell it.

## Getting Started

You can run this either through Docker or through standard Node/npm.

```sh
# Docker
# build the image
docker build . -t <tagname>

# run the image
docker run <tagname>

# npm
# install dependencies
npm install

# run the server
npm start
```

## Deployment

This is set up to deploy to [fly.io](https://fly.io), but you could push the Docker image anywhere, really. If you're set up with fly.io, you can run `fly deploy` to push any changes.
