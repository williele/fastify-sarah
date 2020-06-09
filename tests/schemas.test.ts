import { processSchema } from "../src/schemas";
import { ObjectType, Prop, Exclude, RawProp } from "../src/common/schemas";

describe("schemas", () => {
  @ObjectType()
  class Todo {
    @Prop() id: string;
    @Prop() title: string;
    @Prop() completed: boolean;
  }

  it("should process schema correctly", async () => {
    const configs = await processSchema(Todo);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });
  });

  it("should exclude correctly", async () => {
    @Exclude("id", "completed")
    class CreateTodoDto extends Todo {}

    @Exclude("id", "title")
    class UpdateTodoDto extends Todo {}

    let configs = await processSchema(CreateTodoDto);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        title: { type: "string" },
      },
    });

    configs = await processSchema(UpdateTodoDto);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        completed: { type: "boolean" },
      },
    });
  });

  it("should parse to array and raw schema correctly", async () => {
    @ObjectType()
    class Product {
      @Prop() id: string;
      @RawProp({ minLength: 4 }) @Prop() title: string;

      @RawProp({ minItems: 1 })
      @Prop(() => String)
      categories: string[];
    }

    let configs = await processSchema(Product);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string", minLength: 4 },
        categories: { type: "array", items: { type: "string" }, minItems: 1 },
      },
    });
  });
});
