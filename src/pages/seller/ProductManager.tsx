import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  QrCode,
  DollarSign,
  Info,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProductManager() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

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
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("seller_id", user?.id);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      await nativeService.hapticSuccess();
    } catch (error) {
      console.error("Error deleting product:", error);
      await nativeService.hapticError();
    }
  };

  const toggleStock = async (productId: string, currentStock: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          in_stock: !currentStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("seller_id", user?.id);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, in_stock: !currentStock } : p,
        ),
      );
      await nativeService.hapticImpact("light");
    } catch (error) {
      console.error("Error updating stock:", error);
      await nativeService.hapticError();
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" && product.in_stock) ||
      (stockFilter === "out_of_stock" && !product.in_stock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Product Manager</h1>
      <p className="text-sm text-muted-foreground">
        Manage your product inventory
      </p>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-6 w-6 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">
                {products.filter((p) => p.in_stock).length}
              </p>
              <p className="text-sm text-muted-foreground">In Stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-6 w-6 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">
                {products.filter((p) => !p.in_stock).length}
              </p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                $
                {products
                  .reduce((sum, p) => sum + (p.in_stock ? p.price : 0), 0)
                  .toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex space-x-4">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add Product Button */}
        <Button
          onClick={() => navigate("/seller/products/new")}
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>

        {/* Products List */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Loading your products...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {products.length === 0
                ? "You haven't created any products yet. Click the button above to add your first product!"
                : "No products match your current filters."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Product Header */}
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-xl font-bold text-primary">
                              ${product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                product.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                          <Badge
                            variant={product.in_stock ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Stacked vertically for better mobile layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/seller/codes?product=${product.id}`)
                        }
                        className="w-full justify-start"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate Code
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStock(product.id, product.in_stock)
                        }
                        className="w-full justify-start"
                      >
                        <div
                          className={`h-2 w-2 rounded-full mr-2 ${product.in_stock ? "bg-red-500" : "bg-green-500"}`}
                        />
                        {product.in_stock ? "Out of Stock" : "In Stock"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/seller/products/edit/${product.id}`)
                        }
                        className="w-full justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProduct(product.id)}
                        className="w-full justify-start text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
