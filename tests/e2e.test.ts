import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { randomBytes } from 'crypto';
import { NotFound } from 'http-errors';
import {
  Controller,
  Delete,
  Put,
  Post,
  Get,
  bootstrap,
  CommonStatus,
} from '../src/public-api';

describe('end to end', () => {
  let fastify: FastifyInstance;

  interface Message {
    id: string;
    text: string;
  }

  @Controller('messages')
  @CommonStatus()
  class MessageController {
    messages: { [key: string]: Message } = {};

    @Get()
    all() {
      return Object.values(this.messages);
    }

    @Get(':id')
    get(req: FastifyRequest) {
      if (this.messages[req.params.id]) return this.messages[req.params.id];
      else throw new NotFound('message not found');
    }

    @Post()
    create(req: FastifyRequest) {
      const { text } = req.body;
      const id = randomBytes(5).toString('hex');
      const message: Message = { id, text };

      this.messages[id] = message;
      return message;
    }

    @Put('/:id')
    update(req: FastifyRequest) {
      const message = this.get(req);
      const { text } = req.body;

      message.text = text;
      return message;
    }

    @Delete('/:id')
    delete(req: FastifyRequest) {
      const message = this.get(req);
      delete this.messages[message.id];
      return;
    }
  }

  beforeEach(() => {
    fastify = Fastify();
  });

  it('should registe and work correctly', async () => {
    fastify.register(bootstrap, {
      controllers: [MessageController],
    });

    await fastify.ready();
    // all
    let result = await fastify.inject().get('/messages').end();
    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual([]);

    // create
    result = await fastify
      .inject()
      .post('/messages')
      .body({ text: 'first message' })
      .end();
    expect(result.statusCode).toBe(202);
    expect(result.json()).toHaveProperty('text', 'first message');
    const firstMessage = result.json();

    // all
    result = await fastify.inject().get('/messages').end();
    expect(result.json()).toEqual([firstMessage]);

    // get
    result = await fastify.inject().get(`/messages/${firstMessage.id}`).end();
    expect(result.json()).toEqual(firstMessage);
    // get
    result = await fastify.inject().get(`/messages/2`).end();
    expect(result.statusCode).toBe(404);

    // create
    result = await fastify
      .inject()
      .post('/messages')
      .body({ text: 'second message' })
      .end();
    expect(result.statusCode).toBe(202);
    expect(result.json()).toHaveProperty('text', 'second message');
    let secondMessage = result.json();

    // all
    result = await fastify.inject().get('/messages').end();
    expect(result.json()).toEqual([firstMessage, secondMessage]);

    // update
    result = await fastify
      .inject()
      .put(`/messages/${secondMessage.id}`)
      .body({ text: 'update message' })
      .end();
    expect(result.statusCode).toBe(200);
    expect(result.json()).toHaveProperty('text', 'update message');

    // delete
    result = await fastify
      .inject()
      .delete(`/messages/${secondMessage.id}`)
      .end();
    expect(result.statusCode).toBe(204);

    // all
    result = await fastify.inject().get('/messages').end();
    expect(result.json()).toEqual([firstMessage]);
  });
});
