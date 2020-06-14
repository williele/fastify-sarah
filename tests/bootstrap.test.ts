import Fastify, { FastifyInstance } from "fastify";
import { processBootstrap, bootstrap } from "../src/bootstrap";
import { Controller, Route } from "../src/common/public-api";

describe("bootstrap", () => {
  let fastify: FastifyInstance;

  @Controller("test")
  class TestController {
    @Route("POST")
    create() {}
  }

  beforeEach(() => {
    fastify = Fastify();
  });

  it("should provide sarah methods to get provider", async () => {
    fastify.register(bootstrap, {
      controllers: [TestController],
      providers: [{ token: "foo", useValue: "foo" }],
    });

    await fastify.ready();
    const foo = fastify.sarah.get<string>("foo");
    expect(foo).toBe("foo");
  });

  it("should bootstrap correctly", async () => {
    @Controller("test")
    class TestController {
      @Route("GET")
      all() {}

      @Route("POST")
      create() {}
    }

    @Controller()
    class FooController {
      @Route("GET")
      all() {}
    }

    await processBootstrap(fastify, {
      controllers: [TestController, FooController],
    });
  });
});
