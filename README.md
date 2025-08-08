# Band Extractor

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/craigsdennis/aiave-band-extractor)

This is part of an [AI Avenue](https://aiavenue.show) tutorial. This tutorial demonstrates how you can use an [AI model](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/) to extract information from an image using a [JSON Schema](https://json-schema.org/). 

We make use of [Zod](https://zod.dev) and the powerful tool [z.toJSONSchema()](https://zod.dev/json-schema).

The main code is in [./worker/index.ts](./worker/index.ts).