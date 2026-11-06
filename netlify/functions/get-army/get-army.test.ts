import { beforeEach, describe, expect, it, vi } from "vitest";
import got from "got";
import { handler } from "./get-army";

vi.mock("got", () => ({ default: { get: vi.fn() } }));

const get = got.get as unknown as ReturnType<typeof vi.fn>;

// shaped like got's errors: the helper checks `name`, and HTTPError's response
const httpError = (statusCode: number) =>
  Object.assign(new Error(`Response code ${statusCode}`), {
    name: "HTTPError",
    response: { statusCode },
  });
const parseError = () =>
  Object.assign(new Error("Unexpected token <"), { name: "ParseError" });

const respondWith = (result: unknown) =>
  get.mockReturnValue({ json: () => Promise.resolve(result) });
const failWith = (error: unknown) =>
  get.mockReturnValue({ json: () => Promise.reject(error) });

const call = async (query: Record<string, string>) => {
  const res = (await handler(
    { queryStringParameters: query } as any,
    {} as any
  )) as { statusCode: number; body: string };
  return { statusCode: res.statusCode, body: JSON.parse(res.body) };
};

describe("get-army", () => {
  beforeEach(() => get.mockReset());

  it("proxies a list from the live site", async () => {
    respondWith({ name: "List" });
    expect(await call({ armyId: "abc", isBeta: "false" })).toEqual({
      statusCode: 200,
      body: { name: "List" },
    });
    expect(get).toHaveBeenCalledWith(
      "https://army-forge.onepagerules.com/api/tts?id=abc"
    );
  });

  it("proxies common rules from the beta site", async () => {
    respondWith({ rules: [] });
    expect(await call({ commonRulesId: "2", isBeta: "true" })).toEqual({
      statusCode: 200,
      body: { rules: [] },
    });
    expect(get).toHaveBeenCalledWith(
      "https://army-forge-beta.onepagerules.com/api/rules/common/2"
    );
  });

  it("URL-encodes the ids", async () => {
    respondWith({});
    await call({ armyId: "a&b=c d", isBeta: "false" });
    expect(get).toHaveBeenLastCalledWith(
      "https://army-forge.onepagerules.com/api/tts?id=a%26b%3Dc%20d"
    );
    await call({ commonRulesId: "../2", isBeta: "false" });
    expect(get).toHaveBeenLastCalledWith(
      "https://army-forge.onepagerules.com/api/rules/common/..%2F2"
    );
  });

  it("returns 502 UPSTREAM_UNAVAILABLE when Army Forge answers 5xx", async () => {
    failWith(httpError(503));
    expect(await call({ armyId: "abc", isBeta: "false" })).toEqual({
      statusCode: 502,
      body: {
        error:
          "Army Forge isn't responding right now. Try again in a few minutes.",
        code: "UPSTREAM_UNAVAILABLE",
      },
    });
  });

  it("returns 502 with the beta message for the beta site", async () => {
    failWith(httpError(503));
    expect(await call({ commonRulesId: "2", isBeta: "true" })).toEqual({
      statusCode: 502,
      body: {
        error:
          "The Army Forge beta site isn't responding. Beta lists can't be imported until it's back.",
        code: "UPSTREAM_UNAVAILABLE",
      },
    });
  });

  it("returns 502 when Army Forge sends a non-JSON body", async () => {
    failWith(parseError());
    const res = await call({ armyId: "abc", isBeta: "false" });
    expect(res.statusCode).toBe(502);
    expect(res.body.code).toBe("UPSTREAM_UNAVAILABLE");
  });

  it.each([502, 504])("treats %i as unavailable too", async (status) => {
    failWith(httpError(status));
    expect((await call({ armyId: "abc", isBeta: "false" })).statusCode).toBe(
      502
    );
  });

  it("keeps the 500 and old messages for other failures", async () => {
    // Army Forge answers a plain 500 for an unknown or deleted list id, so a 500
    // means "bad link", not "Army Forge is down"
    failWith(httpError(500));
    expect(await call({ armyId: "abc", isBeta: "false" })).toEqual({
      statusCode: 500,
      body: { error: "Army Forge failed to export list. Sorry!" },
    });

    failWith(httpError(404));
    expect(await call({ armyId: "abc", isBeta: "false" })).toEqual({
      statusCode: 500,
      body: { error: "Army Forge failed to export list. Sorry!" },
    });

    failWith(new Error("ECONNRESET"));
    expect(await call({ commonRulesId: "2", isBeta: "false" })).toEqual({
      statusCode: 500,
      body: { error: "Failed to fetch common rules. Sorry!" },
    });
  });

  it("returns 400 without an id", async () => {
    expect((await call({})).statusCode).toBe(400);
  });
});
