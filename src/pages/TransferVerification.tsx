import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatPublicTransferId } from '../lib/transferVerification';

export default function TransferVerification() {
  const { transferId = '' } = useParams();
  const publicTransferId = formatPublicTransferId(transferId);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <p className="font-mono text-2xl font-semibold tracking-wider text-black" aria-label="Transfer ID">
        {publicTransferId}
      </p>
    </main>
  );
}
