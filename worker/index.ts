import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/describe', async(c) => {
    
    return c.json({hello: "world"});
});

export default app;