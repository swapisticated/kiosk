import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { answerQuestion } from "../services/chat/chatService";

const chatRoute = new Hono();

//define expected req body

const chatSchema = z.object({
  message: z.string().min(1),
  tenantId: z.string().min(1),
});

chatRoute.post("/", zValidator("json", chatSchema), async (c) => {
  //todo
  try {
    //get valid data
    const body = c.req.valid("json");

    //call service
    const result = await answerQuestion(body.tenantId, body.message);

    //return json
    return c.json(result);
  } catch (e) {
    //simple error handling
    console.error(e);
    return c.json({ error: "failed to process message" }, 500);
  }
});

export default chatRoute;
