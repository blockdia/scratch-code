import scratchblocks from 'scratchblocks-plus';
import type { Script } from '@scratch-code/ast';
import type {
  ScratchblocksCoercion,
  ScratchblocksDocument,
} from '@scratch-code/scratchblocks-codec';

import { errorMessage, formatAst, parseAst, scriptsToText, textToAst } from './conversion.js';
import './styles.css';

declare global {
  interface Window {
    ast: Script[];
    doc: ScratchblocksDocument;
  }
}

export const EXAMPLE_SOURCE = [
  'when green flag clicked',
  'set [score v] to [0]',
  'repeat (10)',
  '  move (10) steps',
  '  change [score v] by (1)',
  'end',
  'say (join [Score: ] (score))',
].join('\n');

const requiredElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const textEditor = requiredElement<HTMLTextAreaElement>('#scratchblocks-source');
const astEditor = requiredElement<HTMLTextAreaElement>('#ast-source');
const textError = requiredElement<HTMLParagraphElement>('#text-error');
const astError = requiredElement<HTMLParagraphElement>('#ast-error');
const preview = requiredElement<HTMLDivElement>('#preview');
const previewState = requiredElement<HTMLSpanElement>('#preview-state');
const coercionSelect = requiredElement<HTMLSelectElement>('#coercion');
const toast = requiredElement<HTMLDivElement>('#toast');

const coercion = (): ScratchblocksCoercion =>
  coercionSelect.value === 'strict' ? 'strict' : 'loose';

const clearError = (element: HTMLElement): void => {
  element.textContent = '';
};

const setError = (element: HTMLElement, error: unknown): void => {
  element.textContent = errorMessage(error);
};

let textConversionError = '';
let textPreviewError = '';
const updateTextError = (): void => {
  textError.textContent = textConversionError || textPreviewError;
};

let toastTimer: number | undefined;
const showToast = (message: string): void => {
  toast.textContent = message;
  toast.classList.add('toast-visible');
  if (toastTimer !== undefined) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('toast-visible'), 1800);
};

const renderPreview = (): void => {
  try {
    const documentAst = scratchblocks.parse(textEditor.value, { languages: ['en'] });
    const svg = scratchblocks.render(documentAst, { style: 'scratch3', scale: 0.9 });
    window.doc = documentAst;
    preview.replaceChildren(svg);
    previewState.textContent = 'Up to date';
    previewState.classList.remove('preview-state-error');
    textPreviewError = '';
    updateTextError();
  } catch (error) {
    previewState.textContent = 'Last valid preview';
    previewState.classList.add('preview-state-error');
    textPreviewError = errorMessage(error);
    updateTextError();
  }
};

const convertTextToAst = (): void => {
  try {
    const scripts = textToAst(textEditor.value, coercion());
    astEditor.value = formatAst(scripts);
    window.ast = scripts;
    textConversionError = '';
    updateTextError();
    clearError(astError);
  } catch (error) {
    textConversionError = errorMessage(error);
    updateTextError();
  }
};

const convertAstToText = (): void => {
  try {
    const scripts = parseAst(astEditor.value);
    textEditor.value = scriptsToText(scripts, coercion());
    window.ast = scripts;
    clearError(astError);
    textConversionError = '';
    updateTextError();
    renderPreview();
  } catch (error) {
    setError(astError, error);
  }
};

const copy = async (value: string, label: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
    showToast(`${label} copied`);
  } catch {
    showToast('Clipboard access was unavailable');
  }
};

let previewTimer: number | undefined;
textEditor.addEventListener('input', () => {
  textConversionError = '';
  updateTextError();
  if (previewTimer !== undefined) window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(renderPreview, 180);
});

requiredElement<HTMLButtonElement>('#text-to-ast').addEventListener('click', convertTextToAst);
requiredElement<HTMLButtonElement>('#ast-to-text').addEventListener('click', convertAstToText);
requiredElement<HTMLButtonElement>('#copy-text').addEventListener('click', () => {
  void copy(textEditor.value, 'Text');
});
requiredElement<HTMLButtonElement>('#copy-ast').addEventListener('click', () => {
  void copy(astEditor.value, 'AST');
});
requiredElement<HTMLButtonElement>('#reset').addEventListener('click', () => {
  textEditor.value = EXAMPLE_SOURCE;
  convertTextToAst();
  renderPreview();
  showToast('Example restored');
});

textEditor.value = EXAMPLE_SOURCE;
convertTextToAst();
renderPreview();
