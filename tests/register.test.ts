/// this is a whole controller
import Fastify, { FastifyInstance, FastifyRequest } from "fastify";
import { NotFound } from "http-errors";
import { randomBytes } from "crypto";
import { Controller, Route } from "../src/framework/decorators";
import { bootstrap } from "../src/framework/core/bootstrap";

interface Message {
  id: string;
  text: string;
}

@Controller("message")
export class MessageController {
  messages: { [key: string]: Message } = {};

  @Route("GET")
  all() {
    return Object.values(this.messages);
  }

  @Route("GET", ":id")
  get(req: FastifyRequest) {
    const id = req.params.id;
    if (this.messages[id]) return this.messages[id];
    else throw new NotFound(`message ${id} not exists`);
  }

  @Route("POST")
  create(req: FastifyRequest) {
    const { text } = req.body;
    const id = randomBytes(5).toString("hex");

    const message: Message = { id, text };
    this.messages[id] = message;
    return message;
  }

  @Route("PUT", ":id")
  update(req: FastifyRequest) {
    const message = this.get(req);

    const { text } = req.body;
    message.text = text;
    return message;
  }

  @Route("DELETE", ":id")
  delete(req: FastifyRequest) {
    const message = this.get(req);
    delete this.messages[message.id];
    return message;
  }
}

describe("register", () => {
  let fastify: FastifyInstance;

  beforeEach(() => {
    fastify = Fastify();
  });

  it("should performance correctly", async () => {
    fastify.register(bootstrap, {
      controllers: [MessageController],
    });

    // get all
    let result = await fastify.inject({ method: "GET", url: "/message" });
    expect(result.json()).toEqual([]);

    // add first
    result = await fastify.inject({
      method: "POST",
      url: "/message",
      payload: { text: "first message" },
    });
    let result1 = result.json();
    expect(result1).toHaveProperty("text", "first message");
    expect(result1).toHaveProperty("id");

    // add second
    result = await fastify.inject({
      method: "POST",
      url: "/message",
      payload: { text: "second message" },
    });
    let result2 = result.json();
    expect(result2).toHaveProperty("text", "second message");
    expect(result2).toHaveProperty("id");

    // get all again
    result = await fastify.inject({ method: "GET", url: "/message" });
    expect(result.json()).toEqual([result1, result2]);

    // update second
    result = await fastify.inject({
      method: "PUT",
      url: `/message/${result2.id}`,
      payload: { text: "secondary message" },
    });
    result2 = result.json();
    expect(result2).toHaveProperty("text", "secondary message");

    // get by id
    result = await fastify.inject({
      method: "GET",
      url: `/message/${result1.id}`,
    });
    expect(result.json()).toEqual(result1);

    // delete first
    result = await fastify.inject({
      method: "DELETE",
      url: `/message/${result1.id}`,
    });
    expect(result.json()).toEqual(result1);

    // get all again
    result = await fastify.inject({ method: "GET", url: "/message" });
    expect(result.json()).toEqual([result2]);
  });
});
