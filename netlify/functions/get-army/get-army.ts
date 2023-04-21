import { Handler } from "@netlify/functions";
import got from "got";

// https://army-forge.onepagerules.com/share?id=D4P2sovK&name=Alien_Hives
// https://army-forge.onepagerules.com/api/tts?id=D4P2sovK
export const handler: Handler = async (event, context) => {
  const { name = "stranger" } = event.queryStringParameters;

  const res = await got
    .get("https://army-forge.onepagerules.com/api/tts?id=D4P2sovK")
    .json();

  // console.log("res", JSON.stringify(res, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...(res as any),
    }),
  };
};
