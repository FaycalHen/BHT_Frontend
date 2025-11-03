import html2canvas from 'html2canvas';

export async function exportRecapAsImage(elementId, fileName = 'delivery_recap.png') {
  const element = document.getElementById(elementId);
  if (!element) return;
  // Give the browser a tick to paint any async content (SVG, fonts)
  await new Promise(r => setTimeout(r, 120));
  const canvas = await html2canvas(element, {
    backgroundColor: '#fff',
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
  });
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
