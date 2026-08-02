const PDFDocument = require('pdfkit');

function drawTakenMissedBarChart(doc, { x, y, width, height, takenCount, missedCount }) {
  const max = Math.max(takenCount, missedCount, 1);
  const barWidth = width / 2 - 20;
  const takenHeight = (takenCount / max) * height;
  const missedHeight = (missedCount / max) * height;

  doc
    .rect(x, y + height - takenHeight, barWidth, takenHeight)
    .fill('#2e7d32');
  doc
    .rect(x + width / 2 + 20, y + height - missedHeight, barWidth, missedHeight)
    .fill('#c62828');

  doc.fillColor('black').fontSize(10);
  doc.text('Taken', x, y + height + 5, { width: barWidth, align: 'center' });
  doc.text('Missed', x + width / 2 + 20, y + height + 5, { width: barWidth, align: 'center' });
  doc.text(String(takenCount), x, y + height - takenHeight - 14, { width: barWidth, align: 'center' });
  doc.text(String(missedCount), x + width / 2 + 20, y + height - missedHeight - 14, {
    width: barWidth,
    align: 'center',
  });
}

function generateAdherencePdf(res, { patient, period, adherence, recentMissed }) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text('MediMate Adherence Report', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#555').text(`Patient: ${patient.name}`);
  doc.text(`Period: ${period} (${adherence.periodStart.toDateString()} - ${adherence.periodEnd.toDateString()})`);
  doc.fillColor('black');
  doc.moveDown(1);

  const ratePct = adherence.adherenceRate !== null ? Math.round(adherence.adherenceRate * 100) : null;
  doc.fontSize(16).text(`Adherence rate: ${ratePct !== null ? `${ratePct}%` : 'No data yet'}`);
  doc.moveDown(1.5);

  drawTakenMissedBarChart(doc, {
    x: doc.x,
    y: doc.y,
    width: 300,
    height: 120,
    takenCount: adherence.takenCount,
    missedCount: adherence.missedCount,
  });

  doc.y += 160;
  doc.moveDown(1);
  doc.fontSize(14).text('Missed doses in this period', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);

  if (recentMissed.length === 0) {
    doc.text('None — great adherence!');
  } else {
    for (const log of recentMissed) {
      doc.text(
        `${log.scheduledTime.toISOString().slice(0, 16).replace('T', ' ')}  —  ${log.schedule.medication.name} (${log.schedule.medication.dosage})`
      );
    }
  }

  doc.end();
}

module.exports = { generateAdherencePdf, drawTakenMissedBarChart };
