import { Controller, Route } from "../src/framework/decorators";

describe("demo", () => {
  it("should", () => {
    expect(true).toBeTruthy();

    @Controller()
    class DemoController {
      @Route("GET")
      all() {}
    }
  });
});
