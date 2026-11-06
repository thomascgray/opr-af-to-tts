import { Handler } from "@netlify/functions";
import got from "got";

// The client (src/army-forge/client.ts) checks for this code and shows its own
// translated message, so `error` below is only the English fallback.
export const UPSTREAM_UNAVAILABLE = "UPSTREAM_UNAVAILABLE";

const upstreamUnavailableMessage = (isBeta: boolean) =>
  isBeta
    ? "The Army Forge beta site isn't responding. Beta lists can't be imported until it's back."
    : "Army Forge isn't responding right now. Try again in a few minutes.";

// got throws HTTPError for non-2xx and ParseError when .json() gets HTML (the beta
// host serves a "service suspended" page with a 503 between beta rounds).
// A plain 500 is left out on purpose: Army Forge answers 500 for an unknown or
// deleted list id, and "Army Forge is down" would be the wrong message for a bad link.
const UNAVAILABLE_STATUSES = [502, 503, 504];
const isUpstreamUnavailable = (e: any) =>
  (e?.name === "HTTPError" &&
    UNAVAILABLE_STATUSES.includes(e.response?.statusCode)) ||
  e?.name === "ParseError";

export const fetchUpstreamJson = async (
  url: string,
  isBeta: boolean,
  failureMessage: string
) => {
  try {
    const res = await got.get(url).json();
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    if (isUpstreamUnavailable(e)) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: upstreamUnavailableMessage(isBeta),
          code: UPSTREAM_UNAVAILABLE,
        }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: failureMessage,
      }),
    };
  }
};

export const handler: Handler = async (event, context) => {
  const { armyId = null, isBeta = null, commonRulesId = null } = event.queryStringParameters as any;
  const beta = isBeta === 'true';

  // Handle common rules request
  if (commonRulesId) {
    const baseUrl = beta
      ? 'https://army-forge-beta.onepagerules.com/api/rules/common'
      : 'https://army-forge.onepagerules.com/api/rules/common';

    return fetchUpstreamJson(
      `${baseUrl}/${encodeURIComponent(commonRulesId)}`,
      beta,
      `Failed to fetch common rules. Sorry!`
    );
  }

  // Handle army list request
  if (armyId) {
    const baseUrl = beta
      ? 'https://army-forge-beta.onepagerules.com/api/tts'
      : 'https://army-forge.onepagerules.com/api/tts';

    return fetchUpstreamJson(
      `${baseUrl}?id=${encodeURIComponent(armyId)}`,
      beta,
      `Army Forge failed to export list. Sorry!`
    );
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      error: `Endpoint called without an army list id or commonRulesId`,
    }),
  };
};
