import {
  AfterFunction,
  GetQuery,
  IsColumnSupplied,
  IsPresent,
  Jwt,
  OnAction,
  OnFunction,
  Req,
  Result,
  Results,
  UnboundActions,
} from '../../../../../../../lib';

import type { ActionRequest, Request } from '../../../../../../../lib';
import type { RobustnessItem } from '#cds-models/RobustnessService';

/** Logs what an `@AfterFunction` handler received: `[RobustnessAfter] <function> received=<typeof>:<JSON>`. */
const logReceived = (functionName: string, value: unknown): void => {
  console.log(`[RobustnessAfter] ${functionName} received=${typeof value}:${JSON.stringify(value)}`);
};

@UnboundActions()
class RobustnessActionsHandler {
  // Functions returning a `null` / `String` / `Integer` / `Decimal` / `array of Integer` result

  @OnFunction('returnNull')
  public async returnNull(@Req() req: Request): Promise<null> {
    return null;
  }

  @OnFunction('returnString')
  public async returnString(@Req() req: ActionRequest<{ value: string }>): Promise<string> {
    return req.data.value;
  }

  @OnFunction('returnInteger')
  public async returnInteger(@Req() req: ActionRequest<{ value: number }>): Promise<number> {
    return req.data.value;
  }

  @OnFunction('returnDecimal')
  public async returnDecimal(@Req() req: ActionRequest<{ value: number }>): Promise<number> {
    return req.data.value;
  }

  @OnFunction('returnIntegerList')
  public async returnIntegerList(@Req() req: Request): Promise<number[]> {
    return [1, 2, 3];
  }

  // `@AfterFunction` handlers recording the result they received

  @AfterFunction('returnNull')
  public async afterReturnNull(@Results() result: unknown, @Req() req: Request): Promise<void> {
    logReceived('returnNull', result);
  }

  @AfterFunction('returnString')
  public async afterReturnString(@Result() result: unknown, @Req() req: Request): Promise<void> {
    logReceived('returnString', result);
  }

  @AfterFunction('returnInteger')
  public async afterReturnInteger(@Result() result: unknown, @Req() req: Request): Promise<void> {
    logReceived('returnInteger', result);
  }

  @AfterFunction('returnDecimal')
  public async afterReturnDecimal(@Result() result: unknown, @Req() req: Request): Promise<void> {
    logReceived('returnDecimal', result);
  }

  // Unbound action carrying the query parameter decorators (an unbound action request has no `req.query`)

  @OnAction('readQueryOptions')
  public async readQueryOptions(
    @GetQuery('SELECT', 'columns') columns: unknown,
    @IsPresent('SELECT', 'where') hasWhere: boolean,
    @IsColumnSupplied<RobustnessItem>('name') nameSupplied: boolean,
    @Jwt() jwt: string | undefined,
  ): Promise<string> {
    return `columns=${String(columns)} hasWhere=${String(hasWhere)} nameSupplied=${String(nameSupplied)} jwt=${String(jwt)}`;
  }
}

export default RobustnessActionsHandler;
