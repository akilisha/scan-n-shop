import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SellerBottomNavigation } from "@/components/SellerBottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  Share,
  Printer,
  Copy,
  QrCode,
  BarChart3,
  Tag,
  RefreshCw,
} from "lucide-react";
import { mockProducts } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function CodeGenerator() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [codeType, setCodeType] = useState<"barcode" | "qr" | "price_tag">(
    "qr",
  );
  const [customData, setCustomData] = useState({
    name: "",
    price: "",
    description: "",
    barcode: "",
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const generateRandomBarcode = () => {
    const barcode = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, "0");
    setCustomData({ ...customData, barcode });
  };

  const generateCode = () => {
    let codeData = "";

    if (selectedProduct && selectedProduct !== "custom") {
      const product = mockProducts.find((p) => p.id === selectedProduct);
      if (product) {
        if (codeType === "barcode") {
          codeData = product.barcode || generateRandomBarcode().toString();
        } else if (codeType === "qr") {
          codeData = JSON.stringify({
            type: "product",
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            barcode: product.barcode,
            timestamp: Date.now(),
          });
        } else {
          codeData = JSON.stringify({
            type: "price_tag",
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            currency: "USD",
            timestamp: Date.now(),
          });
        }
      }
    } else {
      // Custom product
      if (codeType === "barcode") {
        codeData = customData.barcode || generateRandomBarcode().toString();
      } else if (codeType === "qr") {
        codeData = JSON.stringify({
          type: "product",
          name: customData.name,
          price: parseFloat(customData.price) || 0,
          description: customData.description,
          barcode: customData.barcode,
          timestamp: Date.now(),
        });
      } else {
        codeData = JSON.stringify({
          type: "price_tag",
          name: customData.name,
          price: parseFloat(customData.price) || 0,
          barcode: customData.barcode,
          currency: "USD",
          timestamp: Date.now(),
        });
      }
    }

    setGeneratedCode(codeData);
    drawCodeToCanvas(codeData);
  };

  const drawCodeToCanvas = (data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (codeType === "barcode") {
      // Draw simple barcode representation
      ctx.fillStyle = "black";
      const barWidth = 2;
      const startX = 50;
      const startY = 100;
      const height = 100;

      for (let i = 0; i < data.length; i++) {
        const digit = parseInt(data[i]);
        const x = startX + i * (barWidth + 1);

        // Vary bar height based on digit
        const barHeight = height - digit * 5;
        ctx.fillRect(x, startY, barWidth, barHeight);
      }

      // Add text
      ctx.fillStyle = "black";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(data, canvas.width / 2, startY + height + 20);
    } else {
      // Draw QR code representation (simplified grid)
      const gridSize = 15;
      const cellSize = 10;
      const startX = (canvas.width - gridSize * cellSize) / 2;
      const startY = (canvas.height - gridSize * cellSize) / 2;

      ctx.fillStyle = "black";

      // Create a pattern based on data hash
      const hash = data.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cellHash = (hash + row * gridSize + col) % 4;
          if (cellHash > 1) {
            ctx.fillRect(
              startX + col * cellSize,
              startY + row * cellSize,
              cellSize - 1,
              cellSize - 1,
            );
          }
        }
      }

      // Add corner markers
      const cornerSize = 3 * cellSize;
      ctx.fillRect(startX, startY, cornerSize, cornerSize);
      ctx.fillRect(
        startX + (gridSize - 3) * cellSize,
        startY,
        cornerSize,
        cornerSize,
      );
      ctx.fillRect(
        startX,
        startY + (gridSize - 3) * cellSize,
        cornerSize,
        cornerSize,
      );

      // Clear center of corners
      ctx.fillStyle = "white";
      const innerSize = cellSize;
      ctx.fillRect(startX + cellSize, startY + cellSize, innerSize, innerSize);
      ctx.fillRect(
        startX + (gridSize - 2) * cellSize,
        startY + cellSize,
        innerSize,
        innerSize,
      );
      ctx.fillRect(
        startX + cellSize,
        startY + (gridSize - 2) * cellSize,
        innerSize,
        innerSize,
      );
    }
  };

  const downloadCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${codeType}_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], `${codeType}.png`, {
            type: "image/png",
          });
          navigator.share({
            files: [file],
            title: `${codeType.toUpperCase()} Code`,
          });
        }
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Code Generator</h1>
        <p className="text-sm text-muted-foreground">
          Create barcodes and QR codes
        </p>
      </div>
    </div>
  );

  return (
    <Layout
      headerContent={headerContent}
      showBottomNav={false}
      className="pb-20"
    >
      <div className="space-y-6">
        {/* Code Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "barcode", icon: BarChart3, label: "Barcode" },
                { type: "qr", icon: QrCode, label: "QR Code" },
                { type: "price_tag", icon: Tag, label: "Price Tag" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setCodeType(type as any)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                    codeType === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product">Select Existing Product</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product or create custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Product</SelectItem>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct === "custom" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Custom Product Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={customData.name}
                        onChange={(e) =>
                          setCustomData({ ...customData, name: e.target.value })
                        }
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={customData.price}
                        onChange={(e) =>
                          setCustomData({
                            ...customData,
                            price: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={customData.description}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Product description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode">Barcode (optional)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="barcode"
                        value={customData.barcode}
                        onChange={(e) =>
                          setCustomData({
                            ...customData,
                            barcode: e.target.value,
                          })
                        }
                        placeholder="Enter or generate barcode"
                      />
                      <Button
                        variant="outline"
                        onClick={generateRandomBarcode}
                        className="px-3"
                      >
                        <RefreshCw size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={generateCode}
          className="w-full"
          size="lg"
          disabled={
            (selectedProduct === "custom" && !customData.name) ||
            !selectedProduct
          }
        >
          Generate {codeType.replace("_", " ").toUpperCase()}
        </Button>

        {/* Generated Code Display */}
        {generatedCode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-border rounded-lg bg-white max-w-full h-auto"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={downloadCode}>
                  <Download size={14} className="mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={shareCode}>
                  <Share size={14} className="mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={copyCode}>
                  <Copy size={14} className="mr-2" />
                  Copy Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} className="mr-2" />
                  Print
                </Button>
              </div>

              {codeType !== "barcode" && (
                <div className="bg-muted p-3 rounded-lg">
                  <Label className="text-xs font-medium">Code Data:</Label>
                  <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                    {JSON.stringify(JSON.parse(generatedCode), null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <SellerBottomNavigation />
    </Layout>
  );
}
