import { useState } from 'react';
import { Download } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export function DownloadPdfButton({ invoice, size = 'sm', variant = 'outline' }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await api.get(`/invoices/${invoice._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size={size} variant={variant} onClick={download} disabled={busy}>
      <Download className="h-4 w-4" /> {busy ? 'Preparing…' : 'PDF'}
    </Button>
  );
}
