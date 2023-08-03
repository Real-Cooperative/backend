import type http from "http";
import type Surreal from "surrealdb.js";

type nodeRequest = http.IncomingMessage;
type nodeResponse = http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage;
};
type headers = http.IncomingHttpHeaders & {
    "x-access-token"?: string;
    "x-refresh-token"?: string;
    "x-rciad-requested-id"?: string;
    "x-rciad-requested-user"?: string;
    "x-rciad-page"?: string;
    "x-rciad-limit"?: string;
    "x-rciad-requested-relation"?: string;
    "x-rciad-subscribed"?: string;
};

type message =
    | {
          message: string;
          e?: Error;
          status?: string;
          details?: any;
      }
    | Array<any>
    | {
          page: {};
          count: number;
      };

type routeFunction = (
    body: any,
    headers: headers,
    db: Surreal
) => Promise<message>;

export { nodeRequest, nodeResponse, Surreal, message, routeFunction };
