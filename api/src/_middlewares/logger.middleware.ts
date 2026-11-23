import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`# Logger Starts`);
    console.log('# Request body: ', req.body);
    console.log('# Request query: ', req.query);
    console.log('# Request params: ', req.params);
    console.log('# Request header: ', req.headers);
    console.log(`# Logger Ends`);

    next();
  }
}
