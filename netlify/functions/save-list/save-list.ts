require("dotenv").config();
import { Handler } from "@netlify/functions";
import * as MySQL from "mysql2/promise";
import { nanoid } from "nanoid";

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
  const connection = await MySQL.createConnection(
    process.env.PLANETSCALE_DATABASE_URL!
  );

  const [rows] = (await connection.query(
    "SELECT * FROM `lists` WHERE `id` = ?",
    [listId]
  )) as any[][];

  if (rows.length !== 1) {
    return httpError(404, "List not found");
  }

  const { list_json } = rows[0];

  const parsedListJson = JSON.parse(list_json);

  return {
    statusCode: 200,
    body: JSON.stringify({
      listId,
      listJson: parsedListJson,
    }),
  };
};

const handlePOST = async (event) => {
  const connection = await MySQL.createConnection(
    process.env.PLANETSCALE_DATABASE_URL!
  );

  const id = nanoid();
  const body = JSON.parse(event.body);
  const { list_json } = body;

  if (!list_json) {
    return httpError(400, "Must supply `list_json`");
  }

  try {
    await connection.execute(
      "INSERT INTO `lists` (id, list_json) VALUES (?, ?)",
      [id, JSON.stringify(list_json)]
    );

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
