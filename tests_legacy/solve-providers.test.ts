import { Container } from "inversify";
import {
  solveFactoryProvider,
  solveProviders,
} from "../src/framework/core/solve-providers";
import { Injectable } from "../src/public-api";

describe("solve providers", () => {
  it("should resolve factory correctly", async () => {
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

  it("should solve list of providers correctly", async () => {
    @Injectable()
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
