import fastify, { FastifyInstance } from "fastify";
import { solveController, solveBootConfig } from "../src/framework/core";
import { Route, Controller } from "../src/framework/decorators";
import { Container } from "inversify";
import { FastifyInst, ControllerInst } from "../src/framework/tokens";

// test controller
@Controller("foo")
class FooController {
  message = "foo controller";

  @Route("GET")
  foo() {
    return "foo";
  }

  @Route("GET", "bar")
  bar() {
    return "bar";
  }

  @Route("POST", "message")
  getMessage() {
    return this.message;
  }
}

describe("core", () => {
  let server: FastifyInstance;
  beforeEach(() => {
    server = fastify();
  });

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

  describe("merge configs", () => {
    // TODO: test merge configs
  });

  describe("boot controller", () => {
    let container: Container;
    beforeEach(() => {
      container = new Container();
      container.bind(FastifyInst).toConstantValue(server);
    });

    it("should resolve and store controller instance", async () => {
      const ctrlContainer = await solveController(container, FooController);
      const ctrlInst = ctrlContainer.get<FooController>(ControllerInst);

      expect(ctrlInst).toBeInstanceOf(FooController);
    });

    it("should apply fastify routes", async () => {
      await solveController(container, FooController);

      let res = await server.inject({ method: "GET", url: "/foo" });
      expect(res.body).toBe("foo");
      res = await server.inject({ method: "GET", url: "/foo/bar" });
      expect(res.body).toBe("bar");
      res = await server.inject({ method: "POST", url: "/foo/message" });
      expect(res.body).toBe("foo controller");
    });
  });
});
