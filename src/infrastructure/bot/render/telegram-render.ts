import type { InlineKeyboardMarkup } from 'telegraf/types';
import { View, ViewModel } from './render-engine.js';

export class TelegramRender {
  static render(vm: ViewModel): View {
    const lines: string[] = [];
    let kb: InlineKeyboardMarkup | undefined;
    let needHtml = false;

    const esc = (s: string | undefined) =>
      s?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    for (const n of vm.nodes) {
      switch (n.type) {
        case 'Title':
          lines.push(n.text, '');
          break;

        case 'Paragraph':
          lines.push(n.text);
          break;

        case 'Divider':
          lines.push('— — — — — — — — — —');
          break;

        case 'Error':
          lines.push('', `❗ ${n.text}`);
          break;

        case 'Prompt':
          lines.push('', n.text);
          break;

        case 'FormRow': {
          const icon = n.state === 'ok' ? '✅' : n.state === 'fill' ? '👉' : '✖️';
          const val = n.value ?? (n.state === 'fill' ? 'Заполняется...' : 'Не заполнено');
          lines.push(`${icon} ${n.label}: [${val}]`);
          break;
        }

        case 'Row': {
          const bullet = n.bullet ? '• ' : '';
          if (n.boldLabel) {
            needHtml = true;
            const label = esc(n.label);
            const value = esc(n.value?.toString());
            lines.push(`${bullet}<b>${label}:</b> ${value}`);
          } else {
            lines.push(`${bullet}${esc(n.label)}: ${esc(n.value?.toString())}`);
          }
          break;
        }

        case 'Keyboard':
          kb = {
            inline_keyboard: n.rows.map((r) =>
              r.map((b) => ({ text: b.text, callback_data: b.cb })),
            ),
          };
          break;
      }
    }

    return {
      text: lines.join('\n'),
      keyboard: kb,
      parseMode: needHtml ? 'HTML' : undefined,
    };
  }
}
