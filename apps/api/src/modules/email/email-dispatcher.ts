export const EMAIL_DISPATCHER = Symbol('EMAIL_DISPATCHER');

export interface EmailDispatcher {
  assertAvailable(): void;
  dispatch(outboxId: string): Promise<boolean>;
  dispatchNext?(): Promise<boolean>;
}
