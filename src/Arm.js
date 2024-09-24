import {reactive} from "./reactive.js";
import {controlFlow} from "./controlFlow.js";
import {assign} from "./shared.js";
import {fragment} from "./mount.js";

export const Arm = controlFlow(reactive().get("test"), assign(fragment, {arm: true}));
