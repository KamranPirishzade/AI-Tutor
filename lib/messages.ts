export const MESSAGES = {
  upload: {
    invalidFileType: "Zəhmət olmasa yalnız PDF fayl yükləyin.",
    noPages: "PDF-də heç bir səhifə tapılmadı.",
    processingFailed: "Fayl emal edilərkən xəta baş verdi. Başqa bir PDF ilə cəhd edin.",
  },
  voice: {
    micPermissionDenied: "Mikrofona giriş əldə edilmədi. Brauzer icazələrini yoxlayın.",
    transcribeFailed: "Səsi mətnə çevirərkən xəta baş verdi.",
  },
  chat: {
    answerFailed: "Suala cavab verərkən xəta baş verdi.",
  },
  api: {
    dailyQuotaExceeded:
      "Gündəlik AI istifadə limitinə çatılıb. Sabah yenidən cəhd edin və ya hesabda billing aktivləşdirin.",
    rateLimited: (seconds: number) =>
      `AI hazırda həddindən artıq məşğuldur. Zəhmət olmasa ~${seconds} saniyə gözləyib yenidən cəhd edin.`,
    networkError: "Şəbəkə bağlantısında xəta baş verdi. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.",
    overloaded: "AI modeli hazırda həddindən artıq yüklənib. Bir neçə saniyə sonra yenidən cəhd edin.",
    chatFallback: "Suala cavab verərkən xəta baş verdi. Yenidən cəhd edin.",
    focusFallback: "Fokus məlumatı alınarkən xəta baş verdi.",
    ttsFallback: "Səsləndirmə zamanı xəta baş verdi. Yenidən cəhd edin.",
    ingestFallback: "Slaydı izah edərkən xəta baş verdi. Yenidən cəhd edin.",
    transcribeFallback: "Səsi mətnə çevirərkən xəta baş verdi. Yenidən cəhd edin.",
  },
} as const;
