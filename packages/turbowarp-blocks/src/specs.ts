import { boostBlockSpecs } from './categories/boost.js';
import { controlBlockSpecs } from './categories/control.js';
import { dataBlockSpecs } from './categories/data.js';
import { eventBlockSpecs } from './categories/event.js';
import { ev3BlockSpecs } from './categories/ev3.js';
import { gdxforBlockSpecs } from './categories/gdxfor.js';
import { looksBlockSpecs } from './categories/looks.js';
import { makeymakeyBlockSpecs } from './categories/makeymakey.js';
import { microbitBlockSpecs } from './categories/microbit.js';
import { motionBlockSpecs } from './categories/motion.js';
import { musicBlockSpecs } from './categories/music.js';
import { operatorsBlockSpecs } from './categories/operators.js';
import { penBlockSpecs } from './categories/pen.js';
import { procedureBlockSpecs } from './categories/procedures.js';
import { sensingBlockSpecs } from './categories/sensing.js';
import { shadowBlockSpecs } from './categories/shadows.js';
import { soundBlockSpecs } from './categories/sound.js';
import { text2speechBlockSpecs } from './categories/text2speech.js';
import { translateBlockSpecs } from './categories/translate.js';
import { twBlockSpecs } from './categories/tw.js';
import { videoSensingBlockSpecs } from './categories/video-sensing.js';
import { wedo2BlockSpecs } from './categories/wedo2.js';

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
  ...penBlockSpecs,
  ...wedo2BlockSpecs,
  ...musicBlockSpecs,
  ...microbitBlockSpecs,
  ...text2speechBlockSpecs,
  ...translateBlockSpecs,
  ...videoSensingBlockSpecs,
  ...ev3BlockSpecs,
  ...makeymakeyBlockSpecs,
  ...boostBlockSpecs,
  ...gdxforBlockSpecs,
  ...twBlockSpecs,
] as const;
