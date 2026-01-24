import { Hono } from "hono";
import { cors } from "hono/cors"; 
import tenantsRoute from "./routes/tenants";
import documentsRoute from "./routes/documents"; 
import chatRoute from "./routes/chat";

const app  = new Hono();

app.use('/*', cors())

app.get('/', (c)=>{
    return c.json({message: 'AI chatbot is running'})
})

app.route('/tenants',tenantsRoute)
app.route('/documents', documentsRoute);
app.route('/chat', chatRoute)
export default app;