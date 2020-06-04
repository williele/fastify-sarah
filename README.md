# Fastify Sarah

A tiny dependencies injection framework for Fastify without addition runtime. Decorators base configuration. Create custom decorators made easy. Similar to NestJS but much simpler.

# Installation

### Manually

Create a folder a make it your current working directory:

```bash
mkdir <your-app>
cd <your-app>
```

Initialize node project and install dependencies

```bash
npm init -y
npm install --save fastify fastify-sarah reflect-metadata
```

##### Setup development environment

Install development dependencies

```bash
npm install -D ts-node-dev typescript @types/node
```

Add `tsconfig.json` for typescript with following options

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2016",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "./dist",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Make sure `experimentalDecorators` and `emitDecoratorMetadata` is always `true`. Because `fastify-sarah` is all about decorators.

`ts-node-dev` will watch your files and auto reload it. In `package.json` file add scripts

```json
// package.json
{
  ...
  "scripts": {
    "dev": "ts-node-dev ./src/main.ts",
    "prestart": "npm run build",
    "start": "node ./dist/main",
    "build": "tsc"
  }
  ...
}
```

> :warning: **`ts-node-dev` will push nortification each time your code reload**. to turn it off change `"dev"` to `"ts-node-dev --no-notify ./src/main.ts"`

# Getting start

First, let's make a controller. Controller is a class, and class methods **can be** fastify route. Controller work as a group of routes, you can configure multiple routes by just configure a controller.

Create a message controller which serve a single welcome message.

```ts
// src/message.controller.ts
import { Controller, Route } from "fastify-sarah";

@Controller()
export class MessageController {
  @Route("GET")
  message() {
    return "hello, world!";
  }
}
```

Here on this file, you created class `MessageController` with `message` method. To turn this class and method into controller and route, add `@Controller()` decorator to the class, and `@Route()` to the method. `@Route` required a route method such as `GET`, `POST`, `PUT`, `DELETE`, you can specify route `url` by second argument, and more fastify route options on third argument. Learn more about [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), [fastify route options](https://www.fastify.io/docs/latest/Routes/#options).

Now that we had a controller, you need to register bootstrap it for be able to use. On `main.ts` file

```ts
// src/main.ts
import "reflect-metadata";
import Fastify from "fastify";
import { bootstrap } from "fastify-sarah";
import { MessageController } from "./message.controller";

const fastify = Fastify();

fastify.register(bootstrap, {
  controllers: [MessageController],
});

fastify.listen(3000).then(() => console.log("Server is ready"));
```

Import your `MessageController` class, initialize your fastify instance and then register `bootstrap` like a fastify plugin. Add your controllers to plugin options properties `controller`. It's array so you can have multiples controllers boot as one.

> :warning: **The `reflect-metadata` polyfill should be imported only once in your entire application**

Now start the server by

```bash
npm run dev
```

Check your browser `http://localhost:3000` and you will see your `hello, world!` message.

#### Add another routes

Let's add one more routes to `MessageController` to send information about resource `Message`. On `MessageController` class add

```ts
// src/message.controller.ts
...

@Controller()
export class MessageController {
  information = {
    resouce: "Message",
    description: "...",
    version: "v0.0.1"
  }

  ...

  @Route("GET", "info")
  info() {
    return this.information;
  }
}
```

Noticed that we add `information` properties for the class and `info` method with `@Route()` decorator. The new `@Route("info")` specify url info. Now check browser again on url `http://localhost:3000/info` you will see your information object defined in `MessageController` class properties.

Let's switch all own resource about message to new url prefix. On `MessageController`, add your prefix url to `@Controller()` decorator.

```ts
...

@Controller("message")
export class MessageController {
  ...
}
```

Now your simple `hello, world!` message route move to `http://localhost:3000/message`, and resource information now move to `http://localhost:3000/message/info`.

This is greate, now you can imagine configure multiple routes logic with a single controller. And with decorators you can reuse a same logic on difference routes.. For examples, authorization for a group of routes can access only by admin user, or publish and unpublish resource. Learn more about this on [custom decorator]() and [authentication example]().

#### Make a CRUD resource

Let's build a RESTFul API with CRUD store in memory. First intall another dependencies for own life easier

```bash
npm install --save http-errors
npm install -D @types/http-errors
```

This package contain some useful http errors. Now, remove all stuff in your `MessageController` class and add these lines into it

```ts
// src/message.controller.ts
import { Controller, Route } from "fastify-sarah";
import { FastifyRequest } from "fastify";
import { randomBytes } from "crypto";
import { NotFound } from "http-errors";

interface Message {
  id: string;
  text: string;
}

@Controller("message")
export class MessageController {
  messages: { [key: string]: Message } = {};

  // GET /message
  @Route("GET")
  all() {
    // turn object into array and reply
    return Object.values(this.messages);
  }

  // GET /message/:id
  @Route("GET", ":id")
  get(req: FastifyRequest) {
    // get id string from request params
    const id = req.params.id;
    // return id exists in message object return it, else throw not found error
    if (this.messages[id]) return this.messages[id];
    else throw new NotFound(`message ${id} not exists`);
  }

  // POST /message
  @Route("POST")
  create(req: FastifyRequest) {
    // get text from request body
    const { text } = req.body;
    // generate random id string with 5 characters
    const id = randomBytes(5).toString("hex");

    // make a new message
    const message: Message = { id, text };
    // store the new message into object
    this.messages[id] = message;
    // reply
    return message;
  }

  // PUT /message/:id
  @Route("PUT", ":id")
  update(req: FastifyRequest) {
    // reuse `this.get` to get request id
    const message = this.get(req);

    // get text from request body
    const { text } = req.body;
    // update text
    message.text = text;
    // reply
    return message;
  }

  // DELETE /message/:id
  @Route("DELETE", ":id")
  delete(req: FastifyRequest) {
    // reuse `this.get` to get request id
    const message = this.get(req);
    // delete message in the object
    delete this.messages[message.id];
    // reply
    return message;
  }
}
```

Now test your REST API. Noticed that a single logic find a message by id if the id not exists throw `NotFound` error on `GET /message` route, can be reuse further on `PUT /message/:id` and `DELETE /message/:id` routes.

#### Add route schema

This is still not good enought. A good backend API always validate incoming request data and use the right [http code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) for right the action. Fortunately, fastify has built in JSON Schema validate by `ajv` make things quite easier, Check out [Fastify validation](https://www.fastify.io/docs/latest/Validation-and-Serialization/). To add schema into route on `fastify-sarah`, there are two ways.

##### 1. Original way to define route JSON schema

Add json schema definition to route configure, by adding third argument into `@Route()`. For example own CRUD routes. Let's add few more JSON schema.

```ts
import { ServerResponse } from "http";

...
const MessageSchema = {
  $id: "Message",
  type: "object",
  properties: {
    id: { type: "string" },
    text: { type: "string" },
  },
};

const CreateMessageDtoSchema = {
  $id: "CreateMessageDto",
  type: "object",
  properties: {
    text: { type: "string", minLength: 4 },
  },
  required: ["text"],
};

...
class MessageController {
  @Route("GET", "", {
    schema: {
      response: { 200: { type: "array", items: MessageSchema } },
    },
  })
  all() {
    ...
  }

  ...
  @Route("POST", "", {
    schema: {
      body: CreateMessageDtoSchema,
      response: { 201: MessageSchema },
    },
  })
  create(req: FastifyRequest, rep: FastifyReply<ServerResponse>) {
    ...
    rep.status(201).send(message);
  }
  ...
}

```

This way for configuring JSON Schema was greate. But it have alot of boilerplate and Typescript cannot recognize any type from body, query, params or return type. This is again the reason we are using Typescript to avoid typo. This problem can solve with type transform tools (JSON Schema to Typescript), but most of tools required extra step to generate your Type, and you have to seperact JSON Schema, Typescript Type and the actual code into multiple files. `fastify-sarah` try to fix this problem by decorators.

##### 2. JSON schema decorator

Define json schema by decorator and class. This will provide benifit both _reusable ability_ and _typescript sugar_.

> :warning: **Upcoming feature**

# How to get Fastify Instance

You can inject fastify instance from custom decorator, injectable class by `FastifyInst` token. Examples

On class

```ts
import { Inject, FastifyInst } from "fastify-sarah";
import { FastifyInstance } from "fastify";

@Controller()
export class MyController {
  constructor(@Inject(FastifyInst) fastify: FastifyInstance) {}
}
```

On custom decorator

```ts
import { makeDecorator, FastifyInst } from "fastify-sarah";
import { FastifyInstance } from "fastify";

export function MyDecorator() {
  return makeDecorator({
    on: "both",
    callback: () => ({
      deps: () => [FastifyInst], // specify inject FastifyInst token here
      factory: (fastify: FastifyInstance /* fastify instance come here */) => {
        ...
      },
    }),
  });
}
```
