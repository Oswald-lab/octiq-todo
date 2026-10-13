import type { Request, Response, NextFunction } from 'express';

export interface HttpRequest {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  user?: { userId: string; email: string; role: string };
  headers: Record<string, string | undefined>;
  method: string;
  path: string;
}

export interface HttpResponse {
  statusCode: number;
  body: unknown;
}

type Controller = (httpRequest: HttpRequest) => Promise<HttpResponse>;

export function makeExpressCallback(controller: Controller) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const httpRequest: HttpRequest = {
      body: req.body ?? {},
      query: req.query as Record<string, unknown>,
      params: req.params as Record<string, unknown>,
      user: (req as any).user,
      headers: {
        'content-type': req.get('Content-Type'),
        authorization: req.get('Authorization'),
        host: req.get('host'),
        'x-forwarded-host': req.get('X-Forwarded-Host'),
        'x-forwarded-proto': req.get('X-Forwarded-Proto') || req.protocol,
      },
      method: req.method,
      path: req.path,
    };

    try {
      const httpResponse = await controller(httpRequest);
      res.status(httpResponse.statusCode).json(httpResponse.body);
    } catch (err) {
      next(err);
    }
  };
}
