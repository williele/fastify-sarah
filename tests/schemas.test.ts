import { processSchema, parseSchema } from "../src/schemas";
import {
  ObjectType,
  Exclude,
  StringProp,
  ArrayProp,
  Required,
  PartialAll,
  Partial,
  BoolProp,
  ObjectProp,
} from "../src/common/schemas";

describe("schemas", () => {
  @ObjectType()
  class Todo {
    @StringProp() id: string;
    @StringProp() title: string;
    @BoolProp() completed: boolean;
  }

  it("should parse schema from type correctly", async () => {
    let result = await parseSchema(String, String, { minLength: 2 });
    expect(result).toEqual({ type: "string", minLength: 2 });

    result = await parseSchema(Array, String);
    expect(result).toEqual({ type: "array", items: { type: "string" } });

    result = await parseSchema(Todo, Todo);
    expect(result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });

    result = await parseSchema(Array, Todo);
    expect(result).toEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          completed: { type: "boolean" },
        },
      },
    });
  });

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
    @Required("id", "name")
    class Category {
      @StringProp() id: string;
      @StringProp() name: string;
    }

    @ObjectType()
    @Required("id", "title", "categories")
    class Product {
      @StringProp() id: string;
      @StringProp({ minLength: 4 }) title: string;

      @ArrayProp({ minItems: 1 })
      @ObjectProp(() => Category)
      categories: (Category | string)[];
    }

    @Exclude("id")
    @Partial("categories")
    class CreateProductDto extends Product {
      @ArrayProp()
      @StringProp()
      categories: string[];
    }

    @Required("confirm")
    @PartialAll()
    class UpdateTodoDto extends CreateProductDto {
      @StringProp({ minLength: 1 })
      confirm: string;
    }

    // Category
    let configs = await processSchema(Category);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    });

    // Product
    configs = await processSchema(Product);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string", minLength: 4 },
        categories: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            required: ["id", "name"],
          },
        },
      },
      required: ["id", "title", "categories"],
    });

    // CreateProductDto
    configs = await processSchema(CreateProductDto);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        title: { type: "string", minLength: 4 },
        categories: { type: "array", items: { type: "string" } },
      },
      required: ["title"],
    });

    // UpdateProductDto
    configs = await processSchema(UpdateTodoDto);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        title: { type: "string", minLength: 4 },
        categories: { type: "array", items: { type: "string" } },
        confirm: { type: "string", minLength: 1 },
      },
      required: ["confirm"],
    });
  });
});
