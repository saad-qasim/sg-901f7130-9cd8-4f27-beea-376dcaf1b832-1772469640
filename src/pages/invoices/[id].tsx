<style jsx global>{`
  /* ===== Screen (طبيعي على الشاشة) ===== */
  .invoice-paper {
    max-width: 900px;            /* خليها بحجم طبيعي على الشاشة */
    margin: 20px auto 40px;
    background: white;
    padding: 24px;               /* px للشاشة */
    box-shadow: 0 0 10px rgba(0,0,0,0.08);
    position: relative;          /* حتى ختم PAID يثبت */
  }

  /* PAID Stamp */
  .paid-stamp {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 120px;
    font-weight: bold;
    color: rgba(34, 197, 94, 0.15);
    border: 8px solid rgba(34, 197, 94, 0.15);
    padding: 20px 60px;
    border-radius: 20px;
    pointer-events: none;
    z-index: 1;
    letter-spacing: 10px;
  }

  .print-only { display: none; }

  /* ===== Print (A4 فقط وقت الطباعة) ===== */
  @page {
    size: A4 portrait;
    margin: 12mm;               /* هوامش واقعية للطباعة */
  }

  @media print {
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print { display: none !important; }
    .print-only { display: block !important; }

    /* مهم: لا height ولا page-break-after */
    .invoice-paper {
      width: 210mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      padding: 12mm !important;    /* mm للطباعة */
      box-shadow: none !important;

      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* منع تقسيم الجدول */
    table, thead, tbody, tr, td, th {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* حجم خط مناسب للطباعة حتى لا يصغر */
    .invoice-paper { font-size: 12pt !important; }
    .invoice-paper h1 { font-size: 20pt !important; }
    .invoice-paper h3 { font-size: 12pt !important; }

    /* ختم PAID واضح في الطباعة */
    .paid-stamp {
      color: rgba(34, 197, 94, 0.2) !important;
      border-color: rgba(34, 197, 94, 0.2) !important;
    }
  }

  /* ===== PDF mode (للتصدير PDF) ===== */
  .pdf-mode.invoice-paper {
    width: 210mm !important;
    max-width: 210mm !important;
    margin: 0 auto !important;
    padding: 12mm !important;
    box-shadow: none !important;
  }
`}</style>