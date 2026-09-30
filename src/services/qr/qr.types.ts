export interface QRPayload {
  v: number;
  prc: string;
  sscc: string;
  data: Record<string, string | number | boolean | null>;
}

export interface QRGenerationResult {
  svg: string;
  payload: string; // The canonical JSON representation
}
