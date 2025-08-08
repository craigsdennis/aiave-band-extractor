import { Hono } from "hono";
import { z } from "zod";
import { Buffer } from "node:buffer";

const app = new Hono<{ Bindings: Env }>();

const EventSchema = z.object({
  venue: z.string().meta({
    description: "The name of the venue where the event is happening",
  }),
  location: z.string().meta({
    description: "The name of the city where this is happening",
  }),
  date: z.string().meta({
    description:
      "The date and time when the event is happening in ISO-8601 format. Determine year based on day of the week and date if year is not provided.",
  }),
  isUpcoming: z.boolean().meta({
    description: "Is this date in the future?",
  }),
});

const OPTIONS = [
  {
    name: "Bands Only",
    schema: z.object({
      bands: z.array(z.string().meta({ description: "The name of the band" })),
    }),
  },
  {
    name: "Events",
    schema: z.object({
      events: z.array(EventSchema),
    }),
  },
];

app.get("/api/schemas", async (c) => {
  const names = OPTIONS.map((option) => option.name);
  return c.json({ result: names });
});

app.post("/api/extract", async (c) => {
  const form = await c.req.formData();
  const schemaName = form.get("schema");
  const file = form.get("upload") as File;
  if (schemaName === undefined || file === undefined) {
    console.warn("Missing information on upload", { schemaName, file });
    return c.notFound();
  }
  const schemaOption = OPTIONS.find((option) => option.name === schemaName);
  if (schemaOption === undefined) {
    console.warn("Schema name not found", schemaName);
    return c.notFound();
  }
  const aBuffer = await file.arrayBuffer();
  const base64String = Buffer.from(aBuffer).toString("base64");
  const objectUrl = `data:${file.type};base64,${base64String}`;
  const jsonSchema = z.toJSONSchema(schemaOption.schema);
  const { response } = await c.env.AI.run(
    "@cf/meta/llama-4-scout-17b-16e-instruct",
    {
      messages: [
        {
          role: "system",
          content: `You help extract information from concert posters.`,
        },
        {
          role: "user",
          content: `Today's is ${new Date().toString()}. Help me with this poster please`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: objectUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 10000,
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
    }
  );
  return c.json({ schemaName, result: response, jsonSchema });
});

export default app;
