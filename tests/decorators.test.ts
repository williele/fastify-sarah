import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Head,
  Options,
  Patch,
} from "../src/decorators";
import { processDecorators } from "dormice";
import { CONTROLLER_ROOT, CONTROLLER_SUB } from "../src/mtadatakeys";

describe("decorators", () => {
  it("should controller decorators work correctly", async () => {
    // custom controller
    @Controller()
    class FooController {
      @Get()
      @Head()
      @Options()
      @Post()
      @Put()
      @Patch()
      @Delete()
      all() {
        return [];
      }
    }

    const providers = await processDecorators(FooController, {
      rootMetadata: CONTROLLER_ROOT,
      subMetadata: CONTROLLER_SUB,
    });

    const sub = providers.sub;
    expect(JSON.stringify(sub.all)).toEqual(
      JSON.stringify([
        { method: "DELETE", url: "" },
        { method: "PATCH", url: "" },
        { method: "PUT", url: "" },
        { method: "POST", url: "" },
        { method: "OPTIONS", url: "" },
        { method: "HEAD", url: "" },
        { method: "GET", url: "" },
      ])
    );
  });
});
