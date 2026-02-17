import type { IncomingMessage, ServerResponse } from "node:http";
import type { Awaitable } from "@tiddo/eddie-utils/async";

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Awaitable<void>;

export interface Route {
  handle: RouteHandler;
}

export interface Router {
  find(req: IncomingMessage): Route | null;
}

interface MatchedRoute extends Route {
  method: string;
  matcher: (pathname: string) => boolean;
}

class RouterImpl implements Router {
  private readonly routes: MatchedRoute[];
  constructor(routes: MatchedRoute[]) {
    this.routes = routes;
  }

  find(req: IncomingMessage): Route | null {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const match = this.routes.find(
      (r) => r.method === req.method && r.matcher(url.pathname),
    );
    return match ?? null;
  }
}

export class RouteBuilder {
  private routes: MatchedRoute[] = [];

  on(method: string, pathname: string, handler: RouteHandler): this {
    this.routes.push({
      method,
      matcher: (p) => p === pathname,
      handle: handler,
    });
    return this;
  }

  onPrefix(method: string, prefix: string, handler: RouteHandler): this {
    this.routes.push({
      method,
      matcher: (p) => p.startsWith(prefix),
      handle: handler,
    });
    return this;
  }

  build(): Router {
    return new RouterImpl(this.routes);
  }
}
