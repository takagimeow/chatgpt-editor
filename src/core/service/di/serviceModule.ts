import { container } from "tsyringe";
import { GlobalState } from "../globalState/GlobalState";
import { GlobalStateImpl } from "../globalState/impl/GlobalStateImpl";

export function serviceModule() {
  container.register<GlobalState>("GlobalState", {
    useClass: GlobalStateImpl
  });
}