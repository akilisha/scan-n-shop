// Temporary stub to avoid build errors - Finix integration coming soon

interface FinixPaymentFormProps {
  amount: number;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export function FinixPaymentForm({
  amount,
  onSuccess,
  onError,
}: FinixPaymentFormProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Payment form temporarily disabled</p>
      <p className="text-xs mt-2">Finix integration coming soon</p>
    </div>
  );
}
