import type http from "http";
import type Surreal from "surrealdb.js";
import type { QueryResult } from "surrealdb.js/script/types.d.ts";

type nodeRequest = http.IncomingMessage;
type nodeResponse = http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage;
};
// copilot add these headers to headers type "Authentication, X-RCIAD-Requested-ID, x-rciad-requested-user, x-rciad-page, x-rciad-limit, x-rciad-requested-relation, x-rciad-subscribed"
type headers = http.IncomingHttpHeaders & {
    "x-access-token"?: string;
    "x-refresh-token"?: string;
    "x-rciad-requested-id"?: string;
    "x-rciad-requested-user"?: string;
    "x-rciad-page"?: string;
    "x-rciad-limit"?: string;
    "x-rciad-requested-relation"?: string;
    "x-rciad-subscribed"?: string;
    authentication?: string;
};

type message =
    | {
          message: string;
          e?: Error;
          status?: string;
          details?: QueryResult;
      }
    | Array<unknown>
    | QueryResult;

type routeFunction = (
    body: any,
    headers: headers,
    db: Surreal
) => Promise<message>;

export { nodeRequest, nodeResponse, Surreal, headers, message, routeFunction };
