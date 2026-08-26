import {controlBlockSpecs} from "./categories/control.js"
import {dataBlockSpecs} from "./categories/data.js"
import {eventBlockSpecs} from "./categories/event.js"
import {looksBlockSpecs} from "./categories/looks.js"
import {motionBlockSpecs} from "./categories/motion.js"
import {operatorsBlockSpecs} from "./categories/operators.js"
import {procedureBlockSpecs} from "./categories/procedures.js"
import {sensingBlockSpecs} from "./categories/sensing.js"
import {shadowBlockSpecs} from "./categories/shadows.js"
import {soundBlockSpecs} from "./categories/sound.js"

export const turboWarpBlockSpecs = [
  ...motionBlockSpecs,
  ...looksBlockSpecs,
  ...soundBlockSpecs,
  ...eventBlockSpecs,
  ...controlBlockSpecs,
  ...sensingBlockSpecs,
  ...operatorsBlockSpecs,
  ...dataBlockSpecs,
  ...procedureBlockSpecs,
  ...shadowBlockSpecs,
] as const
