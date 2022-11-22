import type { NextRequest } from "next/server";
import { unescape } from "html-escaper";

export const config = {
  runtime: "experimental-edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "GET") {
    const url = req.nextUrl.searchParams.get("url");
    try {
      new URL(url).hostname;
    } catch (e) {
      return new Response("Invalid URL", { status: 400 });
    }
    const metatags = await getMetadataFromUrl(url);
    return new Response(JSON.stringify(metatags), { status: 200 });
  } else {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }
}

const getMetadataFromUrl = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // timeout if it takes longer than 5 seconds
  const metatags = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": "dub-bot/1.0",
    },
  })
    .then((res) => {
      clearTimeout(timeoutId);
      return res.text();
    })
    .then((body: string) => {
      const obj = {};
      // get all meta tags
      body.replace(
        /<meta\s+(?:name|property|itemprop|http-equiv)="([^"]+)"\s+content="([^"]+)"/g,
        // @ts-ignore
        (_, key, value) => {
          obj[key] = unescape(value);
        },
      );
      // get all meta tags (reversed order for content & name/property)
      body.replace(
        /<meta\s+content="([^"]+)"\s+(?:name|property|itemprop|http-equiv)="([^"]+)"/g,
        // @ts-ignore
        (_, value, key) => {
          obj[key] = unescape(value);
        },
      );
      // get all title tags
      body.replace(
        /<title>([^<]+)<\/title>/g,
        // @ts-ignore
        (_, value) => {
          obj["title"] = unescape(value);
        },
      );
      // get all link tags
      body.replace(
        /<link\s+(?:rel|itemprop)="([^"]+)"\s+href="([^"]+)"/g,
        // @ts-ignore
        (_, key, value) => {
          obj[key] = unescape(value);
        },
      );
      console.log(obj);

      let image =
        obj["og:image"] ||
        obj["twitter:image"] ||
        obj["icon"] ||
        obj["image_src"];

      if (image && image.startsWith("//")) {
        image = "https:" + image;
      } else if (image && image.startsWith("/")) {
        image = new URL(url).origin + image;
      }

      return {
        title: obj["og:title"] || obj["twitter:title"] || obj["title"],
        description:
          obj["description"] ||
          obj["og:description"] ||
          obj["twitter:description"],
        image,
      };
    })
    .catch((err) => {
      console.log(err);
      return {}; // if there's an error, return ""
    });
  return metatags;
};