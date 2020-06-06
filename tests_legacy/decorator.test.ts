import { makeDecorator } from "../src/framework/core/decorators";

describe("decorator", () => {
  it("should provider type information correctly", () => {
    const methodCallback = jest.fn((info) => {
      expect(info.on).toBe("method");
      expect(info.returnType).toBeTruthy();
      expect(info.returnType).toBe(String);
      expect(info.type).toBe(Function);
    });
    const classCallback = jest.fn((info) => {
      expect(info.on).toBe("class");
    });
    const propertyCallback = jest.fn((info) => {
      expect(info.on).toBe("property");
      expect(info.type).toBeTruthy();
      expect(info.type).toBe(Number);
    });

    const MethodDecorator = makeDecorator(
      { on: ["method"], callback: ({}) => () => {} },
      methodCallback
    );
    const ClassDecorator = makeDecorator(
      { on: ["class"], callback: ({}) => () => {} },
      classCallback
    );
    const PropertyDecorator = makeDecorator(
      { on: ["property"], callback: ({}) => () => {} },
      propertyCallback
    );

    @ClassDecorator
    class Dummy {
      @PropertyDecorator
      dummyProperty: number;

      @MethodDecorator
      dummy(): string {
        return "dummy";
      }
    }
  });
});
