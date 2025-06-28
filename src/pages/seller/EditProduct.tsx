import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SellerBottomNavigation } from "@/components/SellerBottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  Save,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { nativeService } from "@/lib/native";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  in_stock: boolean;
}

export default function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    inStock: true,
  });

  const categories = [
    "Beverages",
    "Food",
    "Electronics",
    "Lifestyle",
    "Fitness",
    "Digital",
    "Clothing",
    "Home & Garden",
    "Books",
    "Other",
  ];

  useEffect(() => {
    if (user && productId) {
      loadProduct();
    }
  }, [user, productId]);

  const loadProduct = async () => {
    if (!user || !productId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("seller_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProductData({
          name: data.name,
          description: data.description || "",
          price: data.price.toString(),
          category: data.category,
          image: data.image_url || "",
          inStock: data.in_stock,
        });
      }
    } catch (error: any) {
      console.error("Error loading product:", error);
      setError("Failed to load product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !productId) {
      setError("You must be logged in to edit products");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Haptic feedback for start
      await nativeService.hapticImpact("medium");

      // Update product in Supabase
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: productData.name,
          description: productData.description || null,
          price: parseFloat(productData.price),
          category: productData.category,
          image_url: productData.image || null,
          in_stock: productData.inStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("seller_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Success haptic feedback
      await nativeService.hapticSuccess();

      // Send success notification
      await nativeService.sendLocalNotification(
        "Product Updated!",
        `${productData.name} has been updated successfully`,
      );

      setSuccess(true);
      setTimeout(() => {
        navigate("/seller/products");
      }, 2000);
    } catch (error: any) {
      console.error("Failed to update product:", error);
      setError(error.message || "Failed to update product. Please try again.");
      await nativeService.hapticError();
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to cloud storage
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductData({ ...productData, image: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isValid = productData.name && productData.price && productData.category;

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Edit Product</h1>
      <p className="text-sm text-muted-foreground">
        Update your product information
      </p>
    </div>
  );

  if (loading) {
    return (
      <Layout
        headerContent={headerContent}
        showBottomNav={false}
        className="pb-20"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
        <SellerBottomNavigation />
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout
        headerContent={headerContent}
        showBottomNav={false}
        className="pb-20"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6 animate-scale-in">
            <Package className="h-10 w-10 text-success-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Product Updated!</h2>
          <p className="text-muted-foreground text-center mb-8">
            Your product has been successfully updated.
          </p>
          <div className="w-full space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate("/seller/products")}
            >
              Back to Products
            </Button>
          </div>
        </div>
        <SellerBottomNavigation />
      </Layout>
    );
  }

  return (
    <Layout
      headerContent={headerContent}
      showBottomNav={false}
      className="pb-20"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate("/seller/products")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        {/* Product Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ImageIcon size={18} className="mr-2" />
              Product Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              {productData.image ? (
                <div className="relative">
                  <img
                    src={productData.image}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={() =>
                      setProductData({ ...productData, image: "" })
                    }
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Label htmlFor="image-upload" className="mt-4">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload size={16} className="mr-2" />
                    Upload Image
                  </span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Package size={18} className="mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={productData.name}
                onChange={(e) =>
                  setProductData({ ...productData, name: e.target.value })
                }
                placeholder="Enter product name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productData.description}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your product"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <div className="relative mt-1">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productData.price}
                    onChange={(e) =>
                      setProductData({ ...productData, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={productData.category}
                  onValueChange={(value) =>
                    setProductData({ ...productData, category: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Tag size={18} className="mr-2" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">In Stock</p>
                <p className="text-sm text-muted-foreground">
                  Product is available for purchase
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={productData.inStock}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      inStock: e.target.checked,
                    })
                  }
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Form Validation & Errors */}
        {!isValid && (
          <Alert>
            <AlertDescription>
              Please fill in all required fields: Product Name, Price, and
              Category.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Product...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Update Product
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/seller/products")}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>

      <SellerBottomNavigation />
    </Layout>
  );
}
