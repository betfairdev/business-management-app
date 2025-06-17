/* eslint-disable @typescript-eslint/no-explicit-any */
// exportUtility.ts
// ----------------
// Browser‑based export utility supporting JSON, CSV, XLSX, TXT, SQL & PDF via HTML table → jsPDF‑AutoTable.
// Integrates ShareUtility, preview, progress callbacks, custom PDF styling, and robust cleanup.

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ShareUtility } from './shareUtility';

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'txt' | 'sql' | 'pdf';

export interface ExportOptions {
  headers?: string[];                     // Column headers
  footers?: string[];                     // Footer row
  data: any[][];                          // Rows of values
  format: ExportFormat;                   // Desired format
  filename?: string;                      // Base filename (no extension)
  tableName?: string;                     // SQL table name
  preview?: boolean;                      // Open non‑PDF in new tab
  share?: boolean;                        // Invoke share after build
  shareText?: string;                     // Text for share dialog
  shareUrl?: string;                      // URL for share dialog
  onProgress?: (percent: number) => void; // Optional progress callback (0–100)
  pdfOptions?: any;                       // Custom jsPDF‑AutoTable options
}

export class ExportUtility {
  static async export(opts: ExportOptions): Promise<void> {
    const name = opts.filename || 'export';
    const fullName = `${name}.${opts.format}`;
    let blob: Blob;

    try {
      // 1) Build the Blob
      switch (opts.format) {
        case 'json':
          blob = new Blob(
            [JSON.stringify(this.buildJson(opts), null, 2)],
            { type: 'application/json' }
          );
          break;

        case 'csv':
          blob = new Blob(
            [this.buildCsv(opts)],
            { type: 'text/csv;charset=utf-8;' }
          );
          break;

        case 'xlsx':
          blob = this.buildXlsx(opts);
          break;

        case 'txt':
          blob = new Blob(
            [this.buildTxt(opts)],
            { type: 'text/plain;charset=utf-8;' }
          );
          break;

        case 'sql':
          blob = new Blob(
            [this.buildSql(opts)],
            { type: 'application/sql;charset=utf-8;' }
          );
          break;

        case 'pdf':
          blob = await this.buildPdf(opts);
          break;

        default:
          throw new Error(`Unsupported format: ${opts.format}`);
      }

      // 2) Preview if requested (non‑PDF)
      if (opts.preview && opts.format !== 'pdf') {
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        w?.addEventListener('load', () => URL.revokeObjectURL(url));
      }

      // 3) Share or download
      if (opts.share) {
        await ShareUtility.shareFile(
          blob,
          fullName,
          `Share ${fullName}`,
          opts.shareText,
          opts.shareUrl
        );
      } else {
        saveAs(blob, fullName);
      }
    } catch (err) {
      console.error('ExportUtility error:', err);
      throw err;
    }
  }

  // — Helpers for each format —

  private static buildJson(opts: ExportOptions): any[] {
    const arr = opts.data.map(row => {
      const obj: Record<string, any> = {};
      if (opts.headers) {
        opts.headers.forEach((h, i) => (obj[h] = row[i]));
      } else {
        row.forEach((val, i) => (obj[`col${i}`] = val));
      }
      return obj;
    });
    if (opts.footers) {
      arr.push({ _footer: opts.footers });
    }
    return arr;
  }

  private static buildCsv(opts: ExportOptions): string {
    const escape = (v: any) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines: string[] = [];
    const hasHeader = Array.isArray(opts.headers) && opts.headers.length > 0;
    const hasFooter = Array.isArray(opts.footers) && opts.footers.length > 0;
    const total = (hasHeader ? 1 : 0) + opts.data.length + (hasFooter ? 1 : 0);
    let count = 0;

    if (hasHeader) {
      lines.push(opts.headers!.map(escape).join(','));
      opts.onProgress?.(Math.round((++count / total) * 100));
    }

    for (const row of opts.data) {
      lines.push(row.map(escape).join(','));
      opts.onProgress?.(Math.round((++count / total) * 100));
    }

    if (hasFooter) {
      lines.push(opts.footers!.map(escape).join(','));
      opts.onProgress?.(Math.round((++count / total) * 100));
    }

    return lines.join('\r\n');
  }

  private static buildXlsx(opts: ExportOptions): Blob {
    const wsData: any[][] = [];
    if (opts.headers) wsData.push(opts.headers);
    wsData.push(...opts.data);
    if (opts.footers) wsData.push(opts.footers);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, opts.tableName || 'Sheet1');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    opts.onProgress?.(100);
    return new Blob([buf], { type: 'application/octet-stream' });
  }

  private static buildTxt(opts: ExportOptions): string {
    const sep = '\t';
    const lines: string[] = [];
    if (opts.headers) lines.push(opts.headers.join(sep));
    opts.data.forEach(r => lines.push(r.join(sep)));
    if (opts.footers) lines.push(opts.footers.join(sep));
    return lines.join('\n');
  }

  private static buildSql(opts: ExportOptions): string {
    if (!opts.data.length) {
      return '-- no data to export';
    }
    const table = opts.tableName || 'my_table';
    const cols = opts.headers ?? opts.data[0].map((_, i) => `col${i}`);
    return opts.data
      .map(row => {
        const vals = row
          .map(v => {
            if (v == null) return 'NULL';
            if (typeof v === 'number') return v.toString();
            return `'${String(v).replace(/'/g, "''")}'`;
          })
          .join(', ');
        return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals});`;
      })
      .join('\n');
  }

  private static async buildPdf(opts: ExportOptions): Promise<Blob> {
    // off‑screen table
    const table = document.createElement('table');
    table.style.visibility = 'hidden';
    table.style.position = 'fixed';
    table.style.top = '-10000px';

    if (opts.headers) {
      const thead = table.createTHead();
      const row = thead.insertRow();
      opts.headers.forEach(h => row.insertCell().textContent = h);
    }
    opts.data.forEach(r => {
      const row = table.insertRow();
      r.forEach(c => row.insertCell().textContent = String(c));
    });
    if (opts.footers) {
      const tfoot = table.createTFoot();
      const row = tfoot.insertRow();
      opts.footers.forEach(f => row.insertCell().textContent = f);
    }

    document.body.appendChild(table);
    const doc = new jsPDF({ unit: 'pt' });
    try {
      (doc as any).autoTable({
        html: table,
        startY: 40,
        ...opts.pdfOptions,
      });
    } finally {
      document.body.removeChild(table);
    }

    return doc.output('blob');
  }
}
