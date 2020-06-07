import Fastify from "fastify";
import { processBootstrap } from "../src/bootstrap";
import { Controller, Route } from "../src/decorators";

describe("bootstrap", () => {
  it("should bootstrap correctly", async () => {
    const fastify = Fastify();

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
