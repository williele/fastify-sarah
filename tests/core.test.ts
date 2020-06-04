import fastify, { FastifyInstance } from "fastify";
import { Route, Controller, Inject } from "../src/framework/decorators";
import { Container, injectable } from "inversify";
import { FastifyInst, ControllerInst } from "../src/framework/tokens";
import {
  solveProviders,
  solveFactoryProvider,
  solveController,
} from "../src/framework/core/solve-config";

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

// test start here
describe("core", () => {
  let server: FastifyInstance;
  beforeEach(() => {
    server = fastify();
  });

  describe("solve factory config", () => {
    it("should solve correctly", async () => {
      const container = new Container();
      container.bind("a").toConstantValue("A");
      container.bind("b").toConstantValue("B");
      container.bind("c").toConstantValue("C");

      const factory = jest.fn((b, c, a) => {
        expect(b).toBe("B");
        expect(c).toBe("C");
        expect(a).toBe("A");
        return { schema: { body: { type: "string" } } };
      });

      const config = await solveFactoryProvider(container, {
        deps: () => ["b", "c", "a"],
        factory,
      });

      expect(factory.mock.calls.length).toBe(1);
      expect(config).toBe(factory.mock.results[0].value);
    });
  });

  describe("solve providers", () => {
    it("should solve correctly", async () => {
      @injectable()
      class Dummy {}

      const container = new Container();
      await solveProviders(container, [
        {
          token: "foo",
          useValue: "foo",
        },
        {
          token: "bar",
          useFactory: () => "bar",
        },
        {
          token: "baz",
          useFactory: {
            deps: () => ["bar"],
            factory: (bar: string) => `${bar} baz`,
          },
        },
        Dummy,
      ]);

      // use value
      expect(container.get("foo")).toBe("foo");

      // use factory
      expect(container.get("bar")).toBe("bar");
      expect(container.get("baz")).toBe("bar baz");

      // use class
      const dummy = container.get(Dummy);
      expect(dummy).toBeInstanceOf(Dummy);
      expect(container.get(Dummy)).toStrictEqual(dummy);
    });
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
