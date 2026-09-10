/** Tiled diagonal watermark drawn over free-plan exports; premium removes it. */
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const text = "Created with rii's crochet tools";
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 22));

  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = "rgba(61, 107, 92, 0.16)";
  ctx.textBaseline = "middle";
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-30 * Math.PI) / 180);

  const textWidth = ctx.measureText(text).width;
  const stepX = textWidth + fontSize * 3;
  const stepY = fontSize * 5;
  const diag = Math.hypot(width, height);

  for (let y = -diag; y < diag; y += stepY) {
    for (let x = -diag; x < diag; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

export function downloadSvgAsPng(svgEl: SVGSVGElement, filename: string, scale = 2, watermark = false) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // The source element is kept off-screen via inline `position:fixed; left:-99999px`.
  // Carrying that over into the serialized document blanks the rasterized image entirely
  // (verified: an otherwise-identical SVG renders fine with this attribute removed).
  clone.removeAttribute("style");

  const widthAttr = svgEl.getAttribute("width") || svgEl.viewBox.baseVal.width.toString();
  const heightAttr = svgEl.getAttribute("height") || svgEl.viewBox.baseVal.height.toString();
  const width = parseFloat(widthAttr) || svgEl.viewBox.baseVal.width || 800;
  const height = parseFloat(heightAttr) || svgEl.viewBox.baseVal.height || 600;

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (watermark) drawWatermark(ctx, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
