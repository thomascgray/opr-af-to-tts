import { Handler } from "@netlify/functions";
import got from "got";

export const handler: Handler = async (event, context) => {
  const { armyId = null } = event.queryStringParameters as any;

  if (armyId) {
    try {
      const res = await got
        .get(`https://army-forge.onepagerules.com/api/tts?id=${armyId}`)
        .json();

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...(res as any),
        }),
      };
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Army Forge failed to export list. Sorry!`,
        }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      error: `Endpoint called without an army list id`,
    }),
  };
};
