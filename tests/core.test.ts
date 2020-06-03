import fastify, { FastifyInstance } from "fastify";
import { bootstrap, boot } from "../src/framework/core";
import { Route, Controller } from "../src/framework/decorators";

describe("core", () => {
  let server: FastifyInstance;
  beforeEach(() => {
    server = fastify();
  });

  describe("boot", () => {
    @Controller()
    class FooController {
      @Route("GET")
      foo() {}
    }

    @Controller()
    class BarController {
      @Route("GET")
      bar() {}
    }

    it("should start correctly", async () => {
      await boot(server, {
        controllers: [FooController, BarController],
      });
    });
  });
});
