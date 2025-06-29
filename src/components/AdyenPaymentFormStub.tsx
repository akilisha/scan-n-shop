// Temporary stub to avoid build errors - Adyen has been replaced with Finix

interface AdyenPaymentFormProps {
  amount: number;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export function AdyenPaymentForm({
  amount,
  onSuccess,
  onError,
}: AdyenPaymentFormProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Payment form temporarily disabled</p>
      <p className="text-xs mt-2">Finix integration coming soon</p>
    </div>
  );
}
