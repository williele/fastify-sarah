import Fastify from "fastify";
import { BootstrapOptions, Controller, Route } from "../src/public-api";
import {
  solveRootConfig,
  solveControllerConfig,
} from "../src/framework/core/solve-config";
import { makeRootContainer } from "../src/framework/core/bootstrap";

describe("solve configuration", () => {
  it("should solve root config correctly", async () => {
    const opts: BootstrapOptions = {
      controllers: [],
      prefix: "api",
    };

    const config = await solveRootConfig(opts);
    expect(config).toEqual({ url: "api" });
  });

  it("should solve controller config correctly", async () => {
    const fastify = Fastify();

    @Controller()
    class DummyController {
      @Route("GET")
      dummy() {}

      @Route("POST", "dummy")
      created() {}
    }

    const container = await makeRootContainer(fastify, {
      controllers: [],
      prefix: "api",
    });

    const configs = await solveControllerConfig(container, DummyController);
    expect(configs.length).toBe(2);
    expect(configs[0]).toHaveProperty("url", "/api");
    expect(configs[0]).toHaveProperty("handler");
    expect(configs[0]).toHaveProperty("method", "GET");
    expect(configs[1]).toHaveProperty("url", "/api/dummy");
    expect(configs[1]).toHaveProperty("handler");
    expect(configs[1]).toHaveProperty("method", "POST");
  });
});
