import koa from 'koa';
import route from 'koa-route';

import { list, del } from './basics';
import upload from './upload';

const app = koa();

app.use(route.get('/', list));
app.use(route.delete('/:orgName', del));
app.use(route.post('/:orgName', upload));

export default app;
