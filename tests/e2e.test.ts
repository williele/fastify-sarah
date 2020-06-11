import Fastify, { FastifyInstance, FastifyRequest } from "fastify";
import { randomBytes } from "crypto";
import { NotFound } from "http-errors";
import {
  Controller,
  Delete,
  Put,
  Post,
  Get,
  bootstrap,
  CommonStatus,
  Body,
  ObjectType,
  StringProp,
  Exclude,
  Required,
  Param,
  Res,
  Partial,
} from "../src/public-api";

describe("end to end", () => {
  let fastify: FastifyInstance;

  @ObjectType()
  @Required("id", "text")
  class Message {
    @StringProp() id: string;
    @StringProp() text: string;
  }

  @Exclude("id")
  class MessageInput extends Message {}
  class CreateMessageInput extends MessageInput {}
  @Partial()
  class UpdateMessageInput extends MessageInput {}

  @Controller("messages")
  @CommonStatus()
  class MessageController {
    messages: { [key: string]: Message } = {};

    @Get() @Res(200, Message) all(): Message[] {
      return Object.values(this.messages);
    }

    @Get(":id") @Res() get(@Param("id") id: string): Message {
      if (this.messages[id]) return this.messages[id];
      else throw new NotFound("message not found");
    }

    @Post() @Res() create(@Body() input: CreateMessageInput): Message {
      const id = randomBytes(5).toString("hex");
      const message: Message = { ...input, id };

      this.messages[id] = message;
      return message;
    }

    @Put(":id") @Res() update(
      @Param("id") id: string,
      @Body() input: UpdateMessageInput
    ): Message {
      const message = this.get(id);
      const { text } = input;

      message.text = text;
      return message;
    }

    @Delete(":id") @Res() delete(@Param("id") id: string) {
      const message = this.get(id);
      delete this.messages[message.id];
      return;
    }
  }

  beforeEach(() => {
    fastify = Fastify();
  });

  it("should registe and work correctly", async () => {
    fastify.register(bootstrap, {
      controllers: [MessageController],
    });

    await fastify.ready();
    // all
    let result = await fastify.inject().get("/messages").end();
    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual([]);

    // create
    result = await fastify
      .inject()
      .post("/messages")
      .body({ text: "first message" })
      .end();
    expect(result.statusCode).toBe(202);
    expect(result.json()).toHaveProperty("text", "first message");
    const firstMessage = result.json();

    // should return 404 bad request
    result = await fastify
      .inject()
      .post("/messages")
      .body({ content: "fake content" })
      .end();
    expect(result.statusCode).toBe(400);

    // all
    result = await fastify.inject().get("/messages").end();
    expect(result.json()).toEqual([firstMessage]);

    // get
    result = await fastify.inject().get(`/messages/${firstMessage.id}`).end();
    expect(result.json()).toEqual(firstMessage);
    // get
    result = await fastify.inject().get(`/messages/2`).end();
    expect(result.statusCode).toBe(404);

    // create
    result = await fastify
      .inject()
      .post("/messages")
      .body({ text: "second message" })
      .end();
    expect(result.statusCode).toBe(202);
    expect(result.json()).toHaveProperty("text", "second message");
    let secondMessage = result.json();

    // all
    result = await fastify.inject().get("/messages").end();
    expect(result.json()).toEqual([firstMessage, secondMessage]);

    // update
    result = await fastify
      .inject()
      .put(`/messages/${secondMessage.id}`)
      .body({ text: "update message" })
      .end();
    expect(result.statusCode).toBe(200);
    expect(result.json()).toHaveProperty("text", "update message");

    // delete
    result = await fastify
      .inject()
      .delete(`/messages/${secondMessage.id}`)
      .end();
    expect(result.statusCode).toBe(204);

    // all
    result = await fastify.inject().get("/messages").end();
    expect(result.json()).toEqual([firstMessage]);
  });
});
