import {
  combineObjects,
  combineConfigs,
  mergeConfigs,
} from "../src/framework/core/merge-config";
import { RouteOptions } from "fastify";

describe("merge fastify configuration", () => {
  it("should combine object should work correctly", () => {
    let a = { body: { type: "string" } };
    let b = {
      query: { type: "object", properties: { s: { type: "string" } } },
    };
    Object.freeze(a);
    Object.freeze(b);

    // combine two objects
    let result = combineObjects(a, b);
    expect(result).toEqual({
      body: { type: "string" },
      query: { type: "object", properties: { s: { type: "string" } } },
    });
    // shouldn't modify input object
    expect(a).toEqual({ body: { type: "string" } });
    expect(b).toEqual({
      query: { type: "object", properties: { s: { type: "string" } } },
    });

    // deep combine
    let c = {
      body: {
        type: "object",
        properties: { title: { type: "string", minLength: 2 } },
        required: ["title"],
      },
      reponse: {
        201: { type: "number" },
      },
    };
    let d = {
      body: {
        type: "object",
        properties: { price: { type: "number", minimum: 0 } },
        required: ["price"],
      },
      reponse: {
        200: { type: "string" },
      },
    };
    Object.freeze(c);
    Object.freeze(d);

    result = combineObjects(c, d);
    expect(result).toEqual({
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 2 },
          price: { type: "number", minimum: 0 },
        },
        required: ["title", "price"],
      },
      reponse: {
        201: { type: "number" },
        200: { type: "string" },
      },
    });
  });

  it("should combine two config correctly", () => {
    const handler = () => {};
    const validationA = () => {};
    const validationB = () => {};
    const validationC = () => {};

    let a: Partial<RouteOptions> = {
      method: "POST",
      url: "foo",
      schema: {
        body: { type: "string" },
      },
    };

    let b: Partial<RouteOptions> = {
      method: "GET",
      url: "bar",
      preValidation: validationA,
      handler,
    };

    Object.freeze(a);
    Object.freeze(b);

    let result = combineConfigs(a, b);
    expect(result).toEqual({
      method: "GET",
      url: "foo/bar",
      schema: {
        body: { type: "string" },
      },
      preValidation: validationA,
      handler,
    });
    Object.freeze(result);

    let c: Partial<RouteOptions> = {
      url: "baz",
      preValidation: validationB,
    };
    Object.freeze(c);

    result = combineConfigs(result, c);
    expect(result).toEqual({
      method: "GET",
      url: "foo/bar/baz",
      schema: {
        body: { type: "string" },
      },
      preValidation: [validationA, validationB],
      handler,
    });
    Object.freeze(result);

    let d: Partial<RouteOptions> = {
      preValidation: validationC,
    };
    result = combineConfigs(result, d);
    expect(result).toEqual({
      method: "GET",
      url: "foo/bar/baz",
      schema: {
        body: { type: "string" },
      },
      preValidation: [validationA, validationB, validationC],
      handler,
    });
  });

  it("should merge multiple config correctly", () => {
    const handlerA = () => {};
    const handlerB = () => {};
    const validationA = () => {};
    const validationB = () => {};

    const result = mergeConfigs([
      { url: "foo", method: "GET", handler: handlerA },
      { url: "bar", preValidation: validationA },
      { preValidation: validationB },
      { schema: { body: { type: "string" } } },
      {
        handler: handlerB,
        schema: {
          querystring: {
            type: "object",
            properties: { s: { type: "string" } },
          },
        },
      },
    ]);
    expect(result).toEqual({
      method: "GET",
      url: "/foo/bar",
      schema: {
        body: { type: "string" },
        querystring: {
          type: "object",
          properties: { s: { type: "string" } },
        },
      },
      preValidation: [validationA, validationB],
      handler: handlerB,
    });
  });
});
