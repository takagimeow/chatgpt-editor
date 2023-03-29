import { container } from "tsyringe";
import { Config } from "../config/Config";
import { ConfigImpl } from "../config/impl/ConfigImpl";
import { GlobalState } from "../globalState/GlobalState";
import { GlobalStateImpl } from "../globalState/impl/GlobalStateImpl";

export function serviceModule() {
  container.register<GlobalState>("GlobalState", {
    useClass: GlobalStateImpl
  });
  container.register<Config>("Config", {
    useClass: ConfigImpl,
  });
}