import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { commentsRouter, foodCommentsRouter } from './routes/comments.js';
import { foodsRouter, groupFoodsRouter } from './routes/foods.js';
import { groupsRouter } from './routes/groups.js';
import { foodReviewsRouter, reviewsRouter } from './routes/reviews.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Nested routers are mounted on their parent so membership can be checked
  // from the parent's id, keeping every child route authorised by group.
  groupsRouter.use('/:groupId/foods', groupFoodsRouter);
  foodsRouter.use('/:foodId/reviews', foodReviewsRouter);
  foodsRouter.use('/:foodId/comments', foodCommentsRouter);

  app.use('/auth', authRouter);
  app.use('/groups', groupsRouter);
  app.use('/foods', foodsRouter);
  app.use('/reviews', reviewsRouter);
  app.use('/comments', commentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
