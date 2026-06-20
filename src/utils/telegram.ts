/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PawnshopSettings } from '../types';

/**
 * Sends a HTML-formatted message to the configured Telegram channel/chat.
 */
export async function sendTelegramNotification(
  settings: PawnshopSettings,
  messageHtml: string
): Promise<boolean> {
  if (!settings.isTelegramEnabled) {
    console.log('Telegram notifications are disabled in settings.');
    return false;
  }

  const token = settings.telegramBotToken?.trim();
  const chatId = settings.telegramChatId?.trim();

  if (!token || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing in settings.');
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Failed to send Telegram notification:', errData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}
