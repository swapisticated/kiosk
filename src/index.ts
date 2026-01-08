import { Hono } from "hono";
import { cors } from "hono/cors"; 
import tenantsRoute from "./routes/tenants";
const app  = new Hono();

app.use('/*', cors())

app.get('/', (c)=>{
    return c.json({message: 'AI chatbot is running'})
})

app.route('/tenants',tenantsRoute)

export default app;