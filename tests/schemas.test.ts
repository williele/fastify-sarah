import { processSchema } from "../src/schemas";
import { Schema, Property, Exclude } from "../src/common/schemas";

describe("schemas", () => {
  @Schema()
  class Todo {
    @Property() id: string;
    @Property() title: string;
    @Property() completed: boolean;
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
});
