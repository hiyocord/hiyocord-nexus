import { Hono } from "hono";

const app = new Hono<{}>();

app.all("/test/interactions", async (c) => {
  return c.json({
    "type": 4,
    "data": {
      "content": "hi, this response is from service worker"
    }
  });
})

export default app

