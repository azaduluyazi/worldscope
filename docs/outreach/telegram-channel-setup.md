# Telegram Channel @worldscope_signals — Setup Guide

## Phase 0 — Hesap ve kanal oluşturma (5 dk, manuel)

1. Telegram'ı aç → New Channel
2. Channel name: `WorldScope Signals`
3. Channel description:
   ```
   Real-time global intelligence signals from WorldScope.
   689 sources · 195 countries · convergent breaking events.

   Free PDF briefing every Sunday: troiamedia.com/briefing
   ```
4. Channel type: **Public**
5. Username: `worldscope_signals`
6. Channel photo: globe screenshot (1280×1280)
7. Add bot as admin (next phase)

## Phase 1 — Bot oluşturma (5 dk, manuel)

1. Telegram'da @BotFather'a yaz
2. `/newbot` komutu
3. Bot name: `WorldScope Signals Bot`
4. Bot username: `worldscope_signals_bot`
5. Token'i AL ve **kimseyle paylaşma**
6. Bot'u channel'e admin olarak ekle (Post messages permission)
7. Token'i `.env.local`'a ekle:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234567890abcdefghijklmnopqrstuv
   TELEGRAM_CHANNEL_ID=@worldscope_signals
   ```
8. Vercel env var olarak da ekle (production için)

## Phase 2 — Posting pipeline (kod hazır)

Pipeline kodu yazıldı: `src/lib/telegram/poster.ts` (aşağıdaki dosya)

Pipeline ne yapıyor:
- High-confidence convergence event'leri yakalar (confidence ≥ 0.85)
- 80/20 ratio ile 4 günlük signal post + 1 pinned briefing CTA
- Rate limit: max 6 post/saat, 30 post/gün
- Format: emoji + headline + sources + map link + briefing CTA

## Phase 3 — Cron entegrasyonu

`vercel.json`'a yeni cron ekle:

```json
{
  "crons": [
    {
      "path": "/api/cron/telegram-signals",
      "schedule": "0,15,30,45 * * * *"
    }
  ]
}
```

15 dakikada bir çalışacak. API route: `src/app/api/cron/telegram-signals/route.ts`

## Phase 4 — Tanıtım

İlk hafta (kanal boş) sahte aktivite YARATMA. Bunun yerine:

1. Kişisel X account'undan kanalı duyur (hak edilmiş kitleyle başla)
2. Bio'larına ekle: troiamedia.com profile'lerinde
3. /briefing sayfasına Telegram badge ekle
4. Reddit `r/OSINT` `r/geopolitics`'te 30 gün sonra "we now have a Telegram channel" comment

İlk 100 follower kritik — bunlar organik growth'u tetikleyen sosyal proof.

## Phase 5 — Telegram Mini App (gelecek faz)

Bot içinde inline app aç: "What's your intel profile?" 5 sorulu quiz, sonunda email gate. Tools: `telegraf` library, `next-telegram-mini-app-sdk`.

ROI: 100 quiz tamamlama → ~30 newsletter signup. Düşük maliyetli viral mekanik.

---

## Manuel checklist (sen yapacaksın)

- [ ] Telegram'da kanalı oluştur → @worldscope_signals
- [ ] @BotFather ile bot oluştur → @worldscope_signals_bot
- [ ] Bot token'i `.env.local` + Vercel env var olarak ekle
- [ ] Bot'u kanala admin yap
- [ ] `vercel.json`'a cron schedule ekle
- [ ] Production deploy
- [ ] İlk manuel post: "Welcome to WorldScope Signals — convergence intelligence, free, real-time. Subscribe to the weekly PDF: troiamedia.com/briefing"
- [ ] X account'undan duyur
