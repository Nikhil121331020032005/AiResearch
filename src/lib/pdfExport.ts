import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ResearchReport, WebSource, ExtractedEvidence } from '@/types/research';

export async function exportReportToPDF(
  question: string,
  report: ResearchReport,
  sources: WebSource[],
  evidence: ExtractedEvidence[],
  elementId?: string
) {
  try {
    // Attempt 1: Try HTML2Canvas rendering if elementId exists, with safe clone stripping CSS variables
    if (elementId && typeof document !== 'undefined') {
      const targetEl = document.getElementById(elementId);
      if (targetEl) {
        try {
          const canvas = await html2canvas(targetEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: targetEl.scrollWidth,
            onclone: (clonedDoc) => {
              // Strip modern CSS color variables that html2canvas cannot parse (Tailwind 4 oklch)
              const clonedTarget = clonedDoc.getElementById(elementId);
              if (clonedTarget) {
                const allElements = clonedTarget.querySelectorAll('*');
                allElements.forEach((el) => {
                  const htmlEl = el as HTMLElement;
                  if (htmlEl.style) {
                    // Force clean fallback text/background colors if computed style contains unsupported function
                    const computed = window.getComputedStyle(htmlEl);
                    if (computed.color && computed.color.includes('oklch')) {
                      htmlEl.style.color = '#1e293b';
                    }
                    if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
                      htmlEl.style.backgroundColor = '#ffffff';
                    }
                  }
                });
              }
            },
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`${cleanFileName(question)}.pdf`);
          return;
        } catch (canvasErr) {
          console.warn('html2canvas render failed, using high-precision jsPDF layout engine:', canvasErr);
        }
      }
    }

    // Attempt 2: High-precision Vector jsPDF Layout Generator (Always succeeds, zero CSS dependency)
    generateVectorPDF(question, report, sources, evidence);
  } catch (err) {
    console.error('Vector PDF generation error:', err);
    // Ultimate fallback: open print view
    window.print();
  }
}

function generateVectorPDF(
  question: string,
  report: ResearchReport,
  sources: WebSource[],
  evidence: ExtractedEvidence[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm
  let y = 20;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      drawHeaderFooter(doc, pageWidth, pageHeight, marginX);
    }
  };

  // Setup page 1 header
  drawHeaderFooter(doc, pageWidth, pageHeight, marginX);

  // Brand Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('RESEARCHAI — AUTONOMOUS AGENT REPORT', marginX, y);
  y += 6;

  // Title Question
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate-900
  const splitTitle = doc.splitTextToSize(question, contentWidth);
  doc.text(splitTitle, marginX, y);
  y += splitTitle.length * 7 + 2;

  // Telemetry Bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`${sources.length} Web Sources Analyzed   •   ${evidence.length} Extracted Claims   •   Generated: ${dateStr}`, marginX, y);
  y += 4;

  // Separator rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 8;

  // 1. Executive Summary Section
  checkPageOverflow(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text('Executive Summary', marginX, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // Slate-700
  const summaryLines = doc.splitTextToSize(report.executiveSummary, contentWidth);
  checkPageOverflow(summaryLines.length * 4.5);
  doc.text(summaryLines, marginX, y);
  y += summaryLines.length * 4.5 + 8;

  // 2. Data Visualization Summary (if chartData exists)
  if (report.chartData) {
    checkPageOverflow(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Data Visualization: ${report.chartData.title}`, marginX, y);
    y += 5;

    if (report.chartData.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(report.chartData.description, marginX, y);
      y += 5;
    }

    // Tabular summary of chart data
    if (report.chartData.data && report.chartData.data.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      const keys = Object.keys(report.chartData.data[0]);
      const colWidth = contentWidth / Math.min(keys.length, 5);

      // Header row
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, y, contentWidth, 6, 'F');
      keys.slice(0, 5).forEach((key, idx) => {
        doc.text(String(key).toUpperCase(), marginX + idx * colWidth + 2, y + 4);
      });
      y += 7;

      // Data rows
      doc.setFont('helvetica', 'normal');
      report.chartData.data.slice(0, 6).forEach((row, rIdx) => {
        checkPageOverflow(6);
        if (rIdx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y, contentWidth, 5.5, 'F');
        }
        keys.slice(0, 5).forEach((key, colIdx) => {
          doc.text(String(row[key] ?? ''), marginX + colIdx * colWidth + 2, y + 4);
        });
        y += 5.5;
      });
      y += 6;
    }
  }

  // 3. Key Findings Section
  checkPageOverflow(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Findings & Detailed Analysis', marginX, y);
  y += 7;

  report.keyFindings.forEach((finding, idx) => {
    checkPageOverflow(20);
    // Finding title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`${idx + 1}. ${finding.title}`, marginX, y);
    y += 5;

    // Finding text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const contentLines = doc.splitTextToSize(finding.content, contentWidth - 4);
    checkPageOverflow(contentLines.length * 4);
    doc.text(contentLines, marginX + 4, y);
    y += contentLines.length * 4 + 6;
  });

  // 4. Comparative Matrix (if present)
  if (report.comparison && report.comparison.length > 0) {
    checkPageOverflow(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Comparative Matrix', marginX, y);
    y += 6;

    report.comparison.forEach((row) => {
      checkPageOverflow(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${row.aspect}:`, marginX, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const rowText = `Option A: ${row.optionA} | Option B: ${row.optionB} | Synthesis: ${row.analysis}`;
      const lines = doc.splitTextToSize(rowText, contentWidth - 4);
      checkPageOverflow(lines.length * 3.8);
      doc.text(lines, marginX + 4, y);
      y += lines.length * 3.8 + 4;
    });
    y += 4;
  }

  // 5. Limitations & Risk Factors
  if (report.limitations && report.limitations.length > 0) {
    checkPageOverflow(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('Limitations & Risk Factors', marginX, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 53, 15);
    report.limitations.forEach((lim) => {
      const lines = doc.splitTextToSize(`• ${lim}`, contentWidth);
      checkPageOverflow(lines.length * 3.8);
      doc.text(lines, marginX, y);
      y += lines.length * 3.8 + 2;
    });
    y += 6;
  }

  // 6. Conclusion
  checkPageOverflow(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Strategic Conclusion', marginX, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const conclusionLines = doc.splitTextToSize(report.conclusion, contentWidth);
  checkPageOverflow(conclusionLines.length * 4);
  doc.text(conclusionLines, marginX, y);
  y += conclusionLines.length * 4 + 8;

  // 7. Sources & References
  checkPageOverflow(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Retrieved Sources & References (${sources.length})`, marginX, y);
  y += 6;

  sources.forEach((s) => {
    checkPageOverflow(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`[${s.id}] ${s.title}`, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`(${s.domain})`, marginX + doc.getTextWidth(`[${s.id}] ${s.title}`) + 2, y);
    y += 4;

    if (s.subQuestion) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Retrieved for: "${s.subQuestion}"`, marginX + 3, y);
      y += 4;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const snippetLines = doc.splitTextToSize(s.snippet, contentWidth - 3);
    checkPageOverflow(snippetLines.length * 3.5);
    doc.text(snippetLines, marginX + 3, y);
    y += snippetLines.length * 3.5 + 4;
  });

  // Save final PDF file
  doc.save(`${cleanFileName(question)}.pdf`);
}

function drawHeaderFooter(doc: jsPDF, pageWidth: number, pageHeight: number, marginX: number) {
  const pageCount = (doc as any).internal.getNumberOfPages();

  // Top accent bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Bottom footer rule & text
  const footerY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY, pageWidth - marginX, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('ResearchAI — Verified Autonomous Research Report', marginX, footerY + 5);

  const pageStr = `Page ${pageCount}`;
  const strWidth = doc.getTextWidth(pageStr);
  doc.text(pageStr, pageWidth - marginX - strWidth, footerY + 5);
}

function cleanFileName(str: string): string {
  return str.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_').slice(0, 30) || 'research_report';
}

export function exportReportToMarkdown(
  question: string,
  report: ResearchReport,
  sources: WebSource[]
) {
  let md = `# ${question}\n\n`;
  md += `*Generated on: ${new Date().toLocaleDateString()} via ResearchAI*\n\n`;
  md += `---\n\n`;

  md += `## Executive Summary\n\n${report.executiveSummary}\n\n`;

  md += `## Key Findings\n\n`;
  for (const f of report.keyFindings) {
    md += `### ${f.title}\n${f.content}\n\n`;
  }

  if (report.comparison && report.comparison.length > 0) {
    md += `## Comparative Analysis\n\n`;
    md += `| Aspect | Option A | Option B | Synthesis |\n`;
    md += `| --- | --- | --- | --- |\n`;
    for (const row of report.comparison) {
      md += `| **${row.aspect}** | ${row.optionA} | ${row.optionB} | ${row.analysis} |\n`;
    }
    md += `\n`;
  }

  if (report.limitations && report.limitations.length > 0) {
    md += `## Limitations & Risks\n\n`;
    for (const lim of report.limitations) {
      md += `- ${lim}\n`;
    }
    md += `\n`;
  }

  md += `## Strategic Conclusion\n\n${report.conclusion}\n\n`;

  md += `## Sources & References\n\n`;
  for (const s of sources) {
    md += `[${s.id}] **${s.title}** (${s.domain})\n`;
    if (s.subQuestion) md += `*Retrieved for: "${s.subQuestion}"*\n`;
    md += `URL: ${s.url}\n${s.snippet}\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanFileName(question)}_report.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportToJSON(
  question: string,
  report: ResearchReport,
  sources: WebSource[],
  evidence: ExtractedEvidence[]
) {
  const payload = {
    question,
    generatedAt: new Date().toISOString(),
    report,
    sources,
    evidence,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanFileName(question)}_report.json`;
  a.click();
  URL.revokeObjectURL(url);
}
