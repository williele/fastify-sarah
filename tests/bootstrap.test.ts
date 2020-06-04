import Fastify, { FastifyInstance } from "fastify";
import { BootstrapOptions } from "../src/framework/types";
import { makeRootContainer } from "../src/framework/core/bootstrap";
import { BootstrapOpts, FastifyInst } from "../src/framework/tokens";

describe("bootstrap", () => {
  let fastify: FastifyInstance;

  beforeEach(() => {
    fastify = Fastify();
  });

  it("should make boot container correctly", async () => {
    const foo = Symbol("foo");
    const bar = Symbol("bar");

    const options: BootstrapOptions = {
      controllers: [],
      providers: [
        { token: foo, useValue: "foo" },
        {
          token: bar,
          useFactory: {
            deps: () => [foo],
            factory: (f) => `${f} bar`,
          },
        },
      ],
      prefix: "api",
      globalDecorators: [],
    };

    // root container should containt all necessary dependencies
    let container = await makeRootContainer(fastify, options);

    // should contain fastify instant
    expect(container.get(FastifyInst)).toBe(fastify);
    // should contain bootstrap options
    expect(container.get(BootstrapOpts)).toBe(options);
    // should resolve providers
    expect(container.get(foo)).toBe("foo");
    expect(container.get(bar)).toBe("foo bar");

    // test if providers is empty
    container = await makeRootContainer(fastify, { controllers: [] });
    expect(container).toBeTruthy();
  });
});
