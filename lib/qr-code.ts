import QRCode from "qrcode";

export function createQrSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    width: 640,
    margin: 4,
    errorCorrectionLevel: "H",
  });
}

export type QrImageEntry = { slug: string; value: string };

export function createQrImageSvg(entries: QrImageEntry[]): string {
  if (entries.length === 0) throw new Error("Se necesita al menos un QR para generar la imagen");

  const columns = Math.min(entries.length, 6);
  const rows = Math.ceil(entries.length / columns);
  const qrSize = 28;
  const gap = 2;
  const padding = 1;
  const labelRowHeight = 32;
  const rowGap = 2;
  const rowStride = labelRowHeight + rowGap;
  const imageWidth = padding * 2 + columns * qrSize + (columns - 1) * gap;
  const imageHeight = padding * 2 + rows * labelRowHeight + (rows - 1) * rowGap;

  const qrMarkup = entries.map((entry, index) => {
    const qr = QRCode.create(entry.value, { errorCorrectionLevel: "H" });
    const row = Math.floor(index / columns);
    const column = index % columns;
    const qrX = padding + column * (qrSize + gap);
    const qrY = padding + row * rowStride;
    const quietZone = 4;
    const viewSize = qr.modules.size + quietZone * 2;
    let path = "";

    for (let matrixRow = 0; matrixRow < qr.modules.size; matrixRow += 1) {
      let matrixColumn = 0;
      while (matrixColumn < qr.modules.size) {
        if (qr.modules.get(matrixRow, matrixColumn) === 0) {
          matrixColumn += 1;
          continue;
        }

        const start = matrixColumn;
        while (matrixColumn < qr.modules.size && qr.modules.get(matrixRow, matrixColumn) === 1) {
          matrixColumn += 1;
        }
        path += `M${quietZone + start} ${quietZone + matrixRow + 0.5}h${matrixColumn - start}`;
      }
    }

    return `<svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"><rect width="${viewSize}" height="${viewSize}" fill="#fff"/><path fill="none" stroke="#000" d="${path}"/></svg><text x="${qrX + qrSize / 2}" y="${qrY + 30.5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.8" font-weight="700" fill="#111">${escapeXml(entry.slug)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}mm" height="${imageHeight}mm" viewBox="0 0 ${imageWidth} ${imageHeight}"><rect width="${imageWidth}" height="${imageHeight}" fill="#fff"/>${qrMarkup}</svg>`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}