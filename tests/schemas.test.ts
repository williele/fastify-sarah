import { processSchema } from "../src/schemas";
import { Schema, Property } from "../src/common/schemas";

describe("schemas", () => {
  it("should process schema correctly", async () => {
    @Schema()
    class Todo {
      @Property()
      id: string;
      @Property()
      title: string;
      @Property()
      completed: boolean;
    }

    const { result } = await processSchema(Todo);
    expect(result).toEqual({
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });
  });
});
