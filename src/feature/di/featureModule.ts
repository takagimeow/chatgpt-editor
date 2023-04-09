import { container } from "tsyringe";
import { Endpoint } from "../endpoint/Endpoint";
import { EndpointImpl } from "../endpoint/impl/EndpointImpl";

export function featureModule() {
  container.register<Endpoint>("Endpoint", {
    useClass: EndpointImpl,
  });
}