const { builder } = require("@netlify/functions");
const AvatarHtml = require("./avatarHtml.js");

const IMAGE_WIDTH = 60;
const IMAGE_HEIGHT = 60;
const IMAGE_TTL = 1 * 7 * 24 * 60 * 60; // 1 week in seconds
const FALLBACK_IMAGE_FORMAT = "png";

/** @type {import('@netlify/functions').Handler} */
async function handler(event, context) {
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/
  let pathSplit = event.path.split("/").filter((entry) => !!entry);
  let [url] = pathSplit;

  url = decodeURIComponent(url);

  try {
    // output to Function logs
    console.log("Fetching", url);

    let avatar = new AvatarHtml(url);
    await avatar.fetch();

    let stats = await avatar.getAvatar(IMAGE_WIDTH, FALLBACK_IMAGE_FORMAT);
    let format = Object.keys(stats).pop();
    let stat = stats[format][0];

    return {
      statusCode: 200,
      headers: {
        "content-type": stat.sourceType,
      },
      body: stat.buffer.toString("base64"),
      isBase64Encoded: true,
      ttl: IMAGE_TTL,
    };
  } catch (error) {
    console.log("Error", error);

    return {
      // We need to return 200 here or Firefox won’t display the image
      // HOWEVER a 200 means that if it times out on the first attempt it will stay the default image until the next build.
      statusCode: 200,
      headers: {
        "content-type": "image/svg+xml",
        "x-error-message": error.message,
      },
      body: `<svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" version="1.1" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
        <g fill="#14294a" fill-rule="evenodd">
        <path d="m1124.9 487.4c0 33.305-40.25 50.031-63.777 26.359l-103.18-103.04-255.82 254.26c-7.6523 7.6523-19.133 7.6523-26.93 0l-66.754-66.754c-7.6523-7.7969-7.6523-19.273 0-26.93l255.82-254.26-103.18-103.18c-23.527-23.527-6.8047-63.918 26.359-63.918h300.04c20.551 0 37.559 17.008 37.559 37.559z"/>
        <path d="m899.96 693.75v187.5c0 93.113-75.539 168.66-168.8 168.66h-487.4c-93.113 0-168.8-75.539-168.8-168.66v-487.54c0-93.113 75.684-168.8 168.8-168.8h412.43c10.488 0 18.707 8.2188 18.707 18.852v37.414c0 10.629-8.0781 18.852-18.707 18.852h-412.43c-51.59 0-93.824 42.094-93.824 93.68v487.54c0 51.445 42.234 93.68 93.824 93.68h487.4c51.59 0 93.824-42.234 93.824-93.68v-187.5c0-10.629 8.2188-18.852 18.707-18.852h37.559c10.488 0 18.707 8.2188 18.707 18.852z"/>
        </g>
      </svg>`,
      isBase64Encoded: false,
    };
  }
}

exports.handler = builder(handler);
