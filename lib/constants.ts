export const PDF_MIME_TYPE = "application/pdf";
export const SLIDE_IMAGE_MIME_TYPE = "image/jpeg";
export const SLIDE_IMAGE_QUALITY = 0.85;

export const SLIDE_STATUS = {
  PENDING: "pending",
  NARRATING: "narrating",
  READY: "ready",
  ERROR: "error",
} as const;
export type SlideStatus = (typeof SLIDE_STATUS)[keyof typeof SLIDE_STATUS];

export const UPLOAD_STATUS = {
  IDLE: "idle",
  RENDERING: "rendering",
} as const;
export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];
