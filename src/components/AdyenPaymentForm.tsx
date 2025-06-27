import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Smartphone, Wallet } from "lucide-react";

interface AdyenPaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function AdyenPaymentForm({
  amount,
  onSuccess,
  onError,
}: AdyenPaymentFormProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const simulateDigitalWallet = async (method: string) => {
    setProcessing(true);
    setError(null);

    try {
      // Simulate digital wallet processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `${method} payment failed`;
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Credit/Debit Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard size={20} />
            <span>Credit or Debit Card</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                value={formData.cardholderName}
                onChange={(e) =>
                  handleInputChange("cardholderName", e.target.value)
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) =>
                  handleInputChange("cardNumber", e.target.value)
                }
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `${amount > 0 ? `Pay $${amount.toFixed(2)}` : "Add Card"}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Digital Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apple Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone size={20} />
              <span>Apple Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => simulateDigitalWallet("Apple Pay")}
              disabled={processing}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Pay with Apple Pay"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Google Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet size={20} />
              <span>Google Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => simulateDigitalWallet("Google Pay")}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Pay with Google Pay"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Total Amount Display */}
      {amount > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold text-primary">
                ${amount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="text-primary font-medium">Adyen</span>.
          Your payment information is secure and encrypted.
        </p>
      </div>
    </div>
  );
}
