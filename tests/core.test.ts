import fastify, { FastifyInstance } from "fastify";
import {
  solveContorller,
  solveBootConfig,
  makeDecorator,
} from "../src/framework/core";
import { Route, Controller } from "../src/framework/decorators";
import { Container } from "inversify";
import { FastifyInst, ControllerInst } from "../src/framework/tokens";

// dummy decorators use for testing
function Dummy() {
  return makeDecorator(() => ({
    deps: () => [],
    registry: () => ({
      preValidation: async (req, res) => {
        console.log("Dummy");
      },
    }),
  }));
}

describe("core", () => {
  let server: FastifyInstance;
  beforeEach(() => {
    server = fastify();
  });

  @Controller("foo")
  class FooController {
    @Route("GET")
    @Dummy()
    foo() {}

    @Route("GET", "bar")
    bar() {}
  }

  describe("solve boot configure", () => {
    const container = new Container();
    container.bind("a").toConstantValue("A");
    container.bind("b").toConstantValue("B");
    container.bind("c").toConstantValue("C");

    const registry = jest.fn((b, c, a) => {
      expect(b).toBe("B");
      expect(c).toBe("C");
      expect(a).toBe("A");
      return { schema: { body: { type: "string" } } };
    });

    const config = solveBootConfig(container, {
      deps: () => ["b", "c", "a"],
      registry,
    });

    expect(registry.mock.calls.length).toBe(1);
    expect(config).toBe(registry.mock.results[0].value);
  });

  describe("boot controller", () => {
    it("should resolve and store controller instance", async () => {
      const container = new Container();
      container.bind(FastifyInst).toConstantValue(server);

      const ctrlContainer = await solveContorller(container, FooController);
      const ctrlInst = ctrlContainer.get<FooController>(ControllerInst);

      expect(ctrlInst).toBeInstanceOf(FooController);
    });
  });
});
