export interface GlobalState {
  save(key: string, value: string): Promise<void>;
  get(key: string): string | undefined;
}