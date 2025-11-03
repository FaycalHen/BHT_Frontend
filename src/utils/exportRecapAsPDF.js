import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportRecapAsPDF(elementId, fileName = 'delivery_recap.pdf', routeUrl = null) {
  const element = document.getElementById(elementId);
  if (!element) return;
  // allow transient rendering to settle
  await new Promise(r => setTimeout(r, 150));
  const canvas = await html2canvas(element, {
    backgroundColor: '#fff',
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Fit the image into the PDF page while preserving aspect ratio
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth - 40; // small margin
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  let y = 20;
  pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
  y += imgHeight + 10;

  // If a route URL is provided, add it as clickable text at the bottom
  if (routeUrl) {
    const text = 'Open route in Google Maps: ' + routeUrl;
    const fontSize = 10;
    pdf.setFontSize(fontSize);
    // wrap text if needed (simple manual wrap)
    const split = pdf.splitTextToSize(text, pageWidth - 40);
    pdf.text(split, 20, y + fontSize);
    // Add a transparent link rectangle over the text area
    const linkHeight = (split.length * (fontSize + 2));
    pdf.link(20, y, pageWidth - 40, linkHeight, { url: routeUrl });
  }

  pdf.save(fileName);
}
