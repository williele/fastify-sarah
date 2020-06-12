import Ajv from "ajv";
import { processSchema, parseSchema } from "../src/schemas";
import {
  ObjectType,
  Exclude,
  StringProp,
  ArrayProp,
  Required,
  Partial,
  BoolProp,
  ObjectProp,
  NumProp,
  Prop,
  IntProp,
} from "../src/common/schemas";

describe("schemas", () => {
  @ObjectType()
  class Todo {
    @StringProp() id: string;
    @StringProp() title: string;
    @BoolProp() completed: boolean;
  }

  it("should process schema correctly", async () => {
    @ObjectType()
    class Todo {
      @StringProp() id: string = String(Math.random());
      @StringProp() title: string;
      @BoolProp() completed: boolean = false;

      constructor(title: string) {
        this.title = title;
      }
    }

    let result = await processSchema(Todo);
    expect(result.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });
    const todo = new Todo("first todo");
    expect(todo).toHaveProperty("title", "first todo");
    expect(todo).toHaveProperty("completed", false);
  });

  it("should parse schema from type correctly", async () => {
    let result = await parseSchema(String, String, { minLength: 2 });
    expect(result).toEqual({ type: "string", minLength: 2 });

    result = await parseSchema(String);
    expect(result).toEqual({ type: "string" });

    result = await parseSchema(Todo, Todo);
    expect(result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });

    result = await parseSchema([Todo]);
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

    result = await parseSchema([String], Array);
    expect(result).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });

  it("should parse array schema correctly", async () => {
    let result = await parseSchema([String]);
    expect(result).toEqual({
      type: "array",
      items: { type: "string" },
    });

    result = await parseSchema([String, Number]);
    expect(result).toEqual({
      type: "array",
      items: [{ type: "string" }, { type: "number" }],
    });
  });

  it("should make schema required correctly", async () => {
    @ObjectType()
    @Required()
    class Foo {
      @StringProp() text: string;
    }

    let result = await processSchema(Foo);
    expect(result.result).toEqual({
      type: "object",
      properties: {
        text: { type: "string" },
      },
      required: ["text"],
    });

    @ObjectType()
    @Required("id")
    class Bar {
      @StringProp() id: string;
      @StringProp() text: string;
    }

    result = await processSchema(Bar);
    expect(result.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        text: { type: "string" },
      },
      required: ["id"],
    });
  });

  it("should make schema partial correctly", async () => {
    @Partial("completed")
    @Required()
    @ObjectType()
    class Foo {
      @StringProp() id: string;
      @StringProp() text: string;
      @BoolProp() completed: boolean;
    }
    let result = await processSchema(Foo);
    expect(result.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        text: { type: "string" },
        completed: { type: "boolean" },
      },
      required: ["id", "text"],
    });

    @Partial()
    class Bar extends Foo {}
    result = await processSchema(Bar);
    expect(result.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        text: { type: "string" },
        completed: { type: "boolean" },
      },
      required: [],
    });

    @ObjectType()
    @Partial()
    class Baz {
      @StringProp() id: string;
    }
    result = await processSchema(Baz);
    expect(result.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
      },
    });
  });

  it("should make schema exclude correctly", async () => {
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

    @ObjectType()
    @Exclude("id")
    class Empty {}

    configs = await processSchema(Empty);
    expect(configs.result).toEqual({
      type: "object",
      properties: {},
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
    @Partial()
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

  it("should process data reference", async () => {
    @ObjectType()
    class Numbo {
      @NumProp({ maximum: { $data: "1/max" } })
      min: number;

      @NumProp({})
      max: number;
    }

    const schema = await parseSchema(Numbo);
    const ajv = new Ajv({ $data: true });
    const validate = ajv.compile(schema);
    expect(validate({ min: 4.5, max: 2 })).toBeFalsy();
    expect(validate({ min: 2, max: 4 })).toBeTruthy();
  });

  it("should make custom schema with Prop decorator", async () => {
    @ObjectType()
    class Foo {
      @Prop() id: string;
      @IntProp() quantity: number;
      @Prop() point: number;
      @Prop() published: boolean;
      @Prop([String]) users: string[];
    }

    let configs = await processSchema(Foo);
    expect(configs.result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        quantity: { type: "integer" },
        point: { type: "number" },
        published: { type: "boolean" },
        users: { type: "array", items: { type: "string" } },
      },
    });
  });
});
