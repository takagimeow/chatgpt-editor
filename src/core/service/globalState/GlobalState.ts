export interface GlobalState {
  clear(key: string): Promise<void>;
  save(key: string, value: string): Promise<void>;
  get(key: string): string | undefined;
}