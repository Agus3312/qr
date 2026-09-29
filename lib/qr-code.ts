import QRCode from "qrcode";

export function createQrSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    width: 640,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}