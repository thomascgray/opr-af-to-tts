import { Handler } from "@netlify/functions";
import got from "got";

export const handler: Handler = async (event, context) => {
  const { armyId = null } = event.queryStringParameters as any;

  if (armyId) {
    const res = await got
      .get(`https://army-forge.onepagerules.com/api/tts?id=${armyId}`)
      .json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...(res as any),
      }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      error: `Endpoint called without an army list id`,
    }),
  };
};
