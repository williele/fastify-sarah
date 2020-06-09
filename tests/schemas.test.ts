import { processSchema } from "../src/schemas";
import {
  ObjectType,
  Prop,
  Exclude,
  StringType,
  ArrayType,
  Required,
  PartialAll,
  Partial,
} from "../src/common/schemas";

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

  it("should parse more advance schema", async () => {
    @ObjectType()
    @Required("id", "title", "categories")
    class Product {
      @StringType() id: string;
      @StringType({ minLength: 4 }) title: string;

      @ArrayType({ minItems: 1 })
      @StringType({ format: "date" })
      categories: string[];
    }

    @Exclude("id")
    @Partial("categories")
    class CreateProductDto extends Product {}

    @Required("confirm")
    @PartialAll()
    class UpdateTodoDto extends CreateProductDto {
      @StringType({ minLength: 1 })
      confirm: string;
    }

    let configs = await processSchema(Product);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string", minLength: 4 },
        categories: {
          type: "array",
          minItems: 1,
          items: { type: "string", format: "date" },
        },
      },
      required: ["id", "title", "categories"],
    });

    configs = await processSchema(CreateProductDto);

    expect(configs.result).toEqual({
      type: "object",
      properties: {
        title: { type: "string", minLength: 4 },
        categories: {
          type: "array",
          minItems: 1,
          items: { type: "string", format: "date" },
        },
      },
      required: ["title"],
    });

    configs = await processSchema(UpdateTodoDto);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        title: { type: "string", minLength: 4 },
        categories: {
          type: "array",
          minItems: 1,
          items: { type: "string", format: "date" },
        },
        confirm: { type: "string", minLength: 1 },
      },
      required: ["confirm"],
    });
  });
});
