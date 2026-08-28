import {
  TURBOWARP_BLOCKS_SOURCE_REVISION,
  turboWarpBlockSpecs,
} from '@scratch-code/turbowarp-blocks';
import type { BlockSpec } from '@scratch-code/block-spec';
import './package.css';

const search = document.querySelector<HTMLInputElement>('#search')!;
const list = document.querySelector<HTMLElement>('#list')!;
const output = document.querySelector<HTMLElement>('#output')!;
const summary = document.querySelector<HTMLElement>('#summary')!;
let selected: string | undefined;

const searchable = (spec: BlockSpec): string =>
  [spec.opcode, spec.shape, ...Object.keys(spec.inputs), ...Object.keys(spec.fields)]
    .join(' ')
    .toLowerCase();
const select = (spec: BlockSpec): void => {
  selected = spec.opcode;
  output.textContent = JSON.stringify(spec, null, 2);
  for (const button of list.querySelectorAll('button'))
    button.classList.toggle('spec-button-active', button.dataset['opcode'] === selected);
};
const render = (): void => {
  const query = search.value.trim().toLowerCase();
  const matches = turboWarpBlockSpecs.filter((spec) => searchable(spec).includes(query));
  summary.textContent = `${matches.length} of ${turboWarpBlockSpecs.length} specs · source ${TURBOWARP_BLOCKS_SOURCE_REVISION.slice(0, 8)}`;
  list.replaceChildren(
    ...matches.map((spec) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spec-button';
      button.dataset['opcode'] = spec.opcode;
      button.textContent = `${spec.opcode} · ${spec.shape}`;
      button.addEventListener('click', () => select(spec));
      return button;
    }),
  );
  const next = matches.find((spec) => spec.opcode === selected) ?? matches[0];
  if (next === undefined) {
    selected = undefined;
    output.textContent = 'No matching block specifications.';
  } else select(next);
};
search.addEventListener('input', render);
render();
