import Fastify, { FastifyInstance } from "fastify";
import {
  Controller,
  Get,
  Res,
  ObjectType,
  StringProp,
  Query,
  ArrayProp,
} from "../src/public-api";
import { processController } from "../src/controllers";
import { Container, createContainer } from "dormice";
import { Fastify as FastifyInst } from "../src/tokens";

describe("controllers", () => {
  let fastify: FastifyInstance;
  let container: Container;

  beforeEach(async () => {
    fastify = Fastify();

    container = await createContainer([
      { token: FastifyInst, useValue: fastify },
    ]);
  });

  it("should make controller decorator correctly", () => {
    expect(true).toBeTruthy();
  });

  it("should make reponse schema correctly", async () => {
    @ObjectType()
    class Message {
      @StringProp() text: string;
    }

    @Controller()
    class TestController {
      @Get() @Res([Message], 200) all(): Message[] {
        return [{ text: "hello world" }];
      }
    }

    const result = await processController(TestController, container);
    expect(result.data.sub.all).toHaveLength(2);
    expect(result.data.sub.all[0]).toEqual({
      schema: {
        response: {
          200: {
            type: "array",
            items: { type: "object", properties: { text: { type: "string" } } },
          },
        },
      },
    });
  });

  it("should make request query correctly", async () => {
    @ObjectType()
    class SearchQuery {
      @StringProp() search: string;
      @ArrayProp() @StringProp() ids: string[];
    }

    const mock = jest.fn((query: SearchQuery) => {
      expect(query.search).toBeTruthy();
      expect(query.search).toBe("hello world");
      expect(query.ids).toBeTruthy();
      expect(query.ids).toEqual(["3e", "4t"]);
    });

    @Controller()
    class TestController {
      @Get()
      all(@Query() query: SearchQuery) {
        mock(query);
        return query.search;
      }
    }

    const result = await processController(TestController, container);
    expect(result.data.sub.all[0]).toEqual({
      schema: {
        querystring: {
          type: "object",
          properties: {
            search: { type: "string" },
            ids: { type: "array", items: { type: "string" } },
          },
        },
      },
    });

    await fastify.ready();

    let res = await fastify
      .inject()
      .get("/")
      .query({ search: "hello world", ids: ["3e", "4t"] })
      .end();
    expect(res.body).toBe("hello world");
  });
});
