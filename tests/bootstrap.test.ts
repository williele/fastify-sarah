import Fastify, { FastifyInstance } from "fastify";
import { processBootstrap, bootstrap } from "../src/bootstrap";
import {
  Controller,
  Route,
  ObjectType,
  Body,
  Injectable,
} from "../src/common/public-api";
import { makeControllerDecorator } from "../src/public-api";

describe("bootstrap", () => {
  let fastify: FastifyInstance;

  @Controller("test")
  class TestController {
    @Route("GET") get() {}
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

  it("should prefix the whole url", async () => {
    fastify.register(bootstrap, {
      controllers: [TestController],
      prefix: "api",
    });

    await fastify.ready();
    const res = await fastify.inject().get("/api/test").end();
    expect(res.statusCode).toBe(200);
  });

  it("should shared services", async () => {
    @Injectable()
    class Service {
      constructor() {}
    }

    let serviceA: Service;
    let serviceB: Service;
    let serviceMethod: Service;

    const Decorator = makeControllerDecorator({
      on: ["class", "method"],
      callback: () => ({
        deps: () => [Service],
        factory: (service: Service) => {
          serviceMethod = service;
          return {};
        },
      }),
    });

    @Controller("a")
    @Decorator
    class AController {
      constructor(public service: Service) {
        serviceA = service;
      }
    }

    @Controller("b")
    class BController {
      constructor(public service: Service) {
        serviceB = service;
      }

      @Route("GET")
      @Decorator
      method() {}
    }

    fastify.register(bootstrap, {
      controllers: [AController, BController],
      providers: [Service],
    });

    await fastify.ready();
    expect(serviceA!).toBe(serviceB!);
    expect(serviceB!).toBe(serviceMethod!);
  });

  it("should add schemas", async () => {
    @ObjectType()
    class Foo {}

    @ObjectType()
    class Bar {}

    @Controller()
    class TestController {
      @Route("POST") create(@Body() bar: Bar) {
        return bar;
      }
    }

    fastify.register(bootstrap, {
      controllers: [TestController],
      schemas: [Foo],
    });

    await fastify.ready();
    expect(fastify.getSchemas()).toHaveProperty("Foo");
    expect(fastify.getSchemas()).toHaveProperty("Bar");
  });

  it("should not add schemas", async () => {
    @ObjectType()
    class Bar {}

    @Controller()
    class TestController {
      @Route("POST") create(@Body() bar: Bar) {
        return bar;
      }
    }

    fastify.register(bootstrap, {
      controllers: [TestController],
      addSchema: false,
    });
    await fastify.ready();
    expect(fastify.getSchemas()).not.toHaveProperty("Bar");
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
