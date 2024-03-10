require("dotenv").config();
import { Handler } from "@netlify/functions";
import { nanoid } from "nanoid";
import { createClient } from "@libsql/client";

const httpError = (code: number, message: string) => ({
  statusCode: code,
  body: JSON.stringify({
    error: message,
  }),
});

const handleGET = async (event) => {
  const { listId = null } = event.queryStringParameters as any;

  if (!listId) {
    return httpError(400, "Must supply `listId`");
  }
  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_AUTH_STRING!,
  });

  const results = await client.execute({
    sql: "SELECT * FROM `lists` WHERE `id` = ?",
    args: [listId],
  });

  const { rows } = results;

  if (rows.length !== 1) {
    return httpError(404, "List not found");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      listId,
      listJson: JSON.parse(rows[0].list_json as string),
    }),
  };
};

const handlePOST = async (event) => {
  const id = nanoid();
  const body = JSON.parse(event.body);
  const { list_json } = body;

  if (!list_json) {
    return httpError(400, "Must supply `list_json`");
  }

  try {
    const client = createClient({
      url: process.env.TURSO_DB_URL!,
      authToken: process.env.TURSO_AUTH_STRING!,
    });

    await client.execute({
      sql: "INSERT INTO `lists` (id, list_json) VALUES (?, ?)",
      args: [id, JSON.stringify(list_json)],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "List saved",
        listId: id,
      }),
    };
  } catch (e) {
    console.error("e", e);
    return httpError(500, "Error saving list");
  }
};

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    return await handleGET(event);
  } else if (event.httpMethod === "POST") {
    return await handlePOST(event);
  }

  return httpError(400, "Must use GET or POST");
};
