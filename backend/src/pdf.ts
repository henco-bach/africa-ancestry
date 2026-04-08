import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

export interface PdfReportData {
  certificateId?: string;
  fullName: string;
  dateOfBirth: string;
  birthPlace: string;
  language: string;
  familyName: string;
  kingdomName: string;
  clanName: string;
  compositeConfidence: number;
  regions: Array<{ display_name?: string | null; name: string }>;
  sources: Array<{ title: string; source_type: string; publication_year?: number | null; citation?: string | null }>;
  narrativeSections: Array<{ id: string; title: string; body: string; confidence: number }>;
  appBaseUrl: string;
}

function formatConfidence(score: number): string {
  return `${(score * 100).toFixed(0)}%`;
}

export async function generatePdf(data: PdfReportData): Promise<{ buffer: Buffer; certificateId: string }> {
  const certificateId = data.certificateId || randomUUID();
  const appBaseUrl = data.appBaseUrl || process.env.APP_BASE_URL || 'https://africaancestry.com';
  const verifyUrl = `${appBaseUrl}/verify/${certificateId}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 100, margin: 1 });

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Africa Ancestry Certificate', Author: 'Africa Ancestry' } });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const gold = '#9a7d2e';
  const dark = '#1c1c1c';
  const muted = '#666666';
  const lightBg = '#faf7ed';
  const borderGold = '#dfd3aa';
  const W = 595 - 100; // page width minus margins

  // ── Border ────────────────────────────────────────────────────────────────
  doc.rect(30, 30, 535, 781).stroke(gold);

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.fillColor(gold).fontSize(22).font('Helvetica-Bold')
    .text('Certificate of African Heritage', 50, 55, { align: 'center', width: W });

  doc.fillColor(muted).fontSize(9).font('Helvetica')
    .text('IDENTITY · ORIGIN · CONTINUITY', 50, 82, { align: 'center', width: W, characterSpacing: 2 });

  doc.moveTo(50, 100).lineTo(545, 100).stroke(borderGold);

  // ── Lead text ─────────────────────────────────────────────────────────────
  doc.fillColor(dark).fontSize(11).font('Helvetica')
    .text(`This certifies that `, 50, 115, { continued: true })
    .font('Helvetica-Bold').text(data.fullName, { continued: true })
    .font('Helvetica').text(' is documented within the lineage and historical framework detailed below.');

  // ── Meta grid ─────────────────────────────────────────────────────────────
  const metaItems = [
    ['Date of Birth', data.dateOfBirth],
    ['Place of Birth', data.birthPlace || 'Not specified'],
    ['Ethno-Linguistic Family', data.familyName],
    ['Kingdom / Nation', data.kingdomName],
    ['Clan / Lineage', data.clanName],
    ['Language', data.language],
    ['Confidence Score', formatConfidence(data.compositeConfidence)],
    ['Issued', new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })]
  ];

  const colW = W / 2 - 6;
  let gridY = 148;
  metaItems.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 50 : 50 + colW + 12;
    const y = gridY + Math.floor(i / 2) * 42;
    doc.rect(x, y, colW, 38).fill(lightBg).stroke(borderGold);
    doc.fillColor(muted).fontSize(8).font('Helvetica')
      .text(label.toUpperCase(), x + 6, y + 6, { width: colW - 12, characterSpacing: 0.5 });
    doc.fillColor(dark).fontSize(10).font('Helvetica-Bold')
      .text(value, x + 6, y + 18, { width: colW - 12, ellipsis: true });
  });

  gridY += Math.ceil(metaItems.length / 2) * 42 + 8;

  // ── Confidence bar ─────────────────────────────────────────────────────────
  doc.fillColor(muted).fontSize(8).font('Helvetica')
    .text(`ANCESTRY CONFIDENCE — ${formatConfidence(data.compositeConfidence)}`, 50, gridY, { characterSpacing: 0.5 });
  doc.rect(50, gridY + 12, W, 5).fill('#f0ead8');
  doc.rect(50, gridY + 12, W * data.compositeConfidence, 5).fill(gold);
  gridY += 28;

  doc.moveTo(50, gridY).lineTo(545, gridY).stroke(borderGold);
  gridY += 12;

  // ── Narrative sections ─────────────────────────────────────────────────────
  for (const section of data.narrativeSections) {
    if (gridY > 680) { doc.addPage(); gridY = 55; }

    doc.fillColor(gold).fontSize(9).font('Helvetica-Bold')
      .text(section.title.toUpperCase(), 50, gridY, { characterSpacing: 0.5 });
    gridY += 13;

    const bodyText = section.body;
    const bodyHeight = doc.heightOfString(bodyText, { width: W });
    doc.fillColor(dark).fontSize(10).font('Helvetica')
      .text(bodyText, 50, gridY, { width: W });
    gridY += bodyHeight + 14;
  }

  // ── Sources ───────────────────────────────────────────────────────────────
  if (data.sources.length > 0) {
    if (gridY > 680) { doc.addPage(); gridY = 55; }
    doc.moveTo(50, gridY).lineTo(545, gridY).stroke(borderGold);
    gridY += 12;
    doc.fillColor(gold).fontSize(9).font('Helvetica-Bold')
      .text('SOURCES & REFERENCES', 50, gridY, { characterSpacing: 0.5 });
    gridY += 14;

    for (const s of data.sources.slice(0, 6)) {
      if (gridY > 720) break;
      const year = s.publication_year ? ` (${s.publication_year})` : '';
      doc.fillColor(dark).fontSize(9).font('Helvetica-Bold').text(s.title, 50, gridY, { continued: true })
        .font('Helvetica').fillColor(muted).text(` · ${s.source_type}${year}`);
      gridY += 14;
    }
  }

  // ── Verification page ─────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(30, 30, 535, 781).stroke(gold);

  doc.fillColor(gold).fontSize(14).font('Helvetica-Bold')
    .text('Verification', 50, 55);
  doc.moveTo(50, 74).lineTo(545, 74).stroke(borderGold);

  doc.image(qrBuffer, 50, 90, { width: 100, height: 100 });

  doc.fillColor(muted).fontSize(8).font('Helvetica')
    .text('CERTIFICATE ID', 170, 90, { characterSpacing: 0.5 });
  doc.fillColor(dark).fontSize(10).font('Helvetica-Bold')
    .text(certificateId, 170, 103);
  doc.fillColor(muted).fontSize(9).font('Helvetica')
    .text('Scan the QR code to verify this certificate online.', 170, 120, { width: 330 })
    .text('This report is probabilistic — confidence reflects current source coverage and match quality.', 170, 134, { width: 330 });

  doc.moveTo(50, 210).lineTo(250, 210).stroke(dark);
  doc.fillColor(muted).fontSize(9).font('Helvetica').text('Africa Ancestry Certification', 50, 216);

  doc.fillColor(muted).fontSize(8)
    .text(
      'Africa Ancestry provides ancestry analysis based on structured historical and linguistic records. Results are probabilistic estimates, not definitive genealogical proof. This certificate is for personal and cultural use only.',
      50, 700, { width: W, align: 'center' }
    );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve({ buffer: Buffer.concat(chunks), certificateId });
    });
  });
}
