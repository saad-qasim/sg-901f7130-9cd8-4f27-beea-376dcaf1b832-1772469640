import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ExternalLink, Package } from "lucide-react";
import BackButton from "@/components/BackButton";

interface SearchResult {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  warranty_end_date: string;
  product_name: string;
  serial_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  brand_name: string;
  brand_logo_url: string | null;
}

export default function SearchSerialPage() {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serialNumber.trim()) {
      alert("Please enter a serial number");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      const { data, error } = await supabase
        .from("invoice_items")
        .select(`
          id,
          serial_number,
          product_name_snapshot,
          invoices!inner (
            id,
            invoice_number,
            invoice_date,
            warranty_end_date,
            customers!inner (
              name,
              phone,
              address
            ),
            brands!inner (
              name,
              logo_url
            )
          )
        `)
        .ilike("serial_number", `%${serialNumber.trim()}%`);

      if (error) throw error;

      const formattedResults: SearchResult[] = data.map((item: any) => ({
        invoice_id: item.invoices.id,
        invoice_number: item.invoices.invoice_number,
        invoice_date: item.invoices.invoice_date,
        warranty_end_date: item.invoices.warranty_end_date,
        product_name: item.product_name_snapshot,
        serial_number: item.serial_number,
        customer_name: item.invoices.customers.name,
        customer_phone: item.invoices.customers.phone,
        customer_address: item.invoices.customers.address,
        brand_name: item.invoices.brands.name,
        brand_logo_url: item.invoices.brands.logo_url,
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error("Error searching serial number:", error);
      alert("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isWarrantyValid = (warrantyEndDate: string) => {
    return new Date(warrantyEndDate) > new Date();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <BackButton />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Serial Number Search</h1>
        <p className="text-muted-foreground">
          Search for device warranty and invoice information by serial number
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Device</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="serial" className="sr-only">
                Serial Number
              </Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="serial"
                  placeholder="Enter device serial number..."
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              <Search size={16} />
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  No devices found with serial number &quot;{serialNumber}&quot;
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  {results.length} {results.length === 1 ? "Result" : "Results"} Found
                </h2>
              </div>

              {results.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Brand Logo */}
                      {result.brand_logo_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={result.brand_logo_url}
                            alt={result.brand_name}
                            className="w-24 h-24 object-contain"
                          />
                        </div>
                      )}

                      {/* Main Content */}
                      <div className="flex-1 space-y-4">
                        {/* Product and Serial */}
                        <div>
                          <h3 className="text-xl font-bold mb-1">
                            {result.product_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Serial Number:{" "}
                            <span className="font-mono font-semibold">
                              {result.serial_number}
                            </span>
                          </p>
                        </div>

                        {/* Warranty Status */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              isWarrantyValid(result.warranty_end_date)
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            }`}
                          >
                            {isWarrantyValid(result.warranty_end_date)
                              ? "✓ Warranty Active"
                              : "✗ Warranty Expired"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Valid until {formatDate(result.warranty_end_date)}
                          </span>
                        </div>

                        {/* Invoice and Customer Info Grid */}
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                          <div>
                            <h4 className="font-semibold mb-2">Invoice Details</h4>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Number:</span>{" "}
                                <span className="font-semibold">
                                  {result.invoice_number}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Date:</span>{" "}
                                {formatDate(result.invoice_date)}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Brand:</span>{" "}
                                {result.brand_name}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Customer Information</h4>
                            <div className="space-y-1 text-sm">
                              <p className="font-semibold">{result.customer_name}</p>
                              {result.customer_phone && (
                                <p className="text-muted-foreground">
                                  Phone: {result.customer_phone}
                                </p>
                              )}
                              {result.customer_address && (
                                <p className="text-muted-foreground">
                                  {result.customer_address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* View Invoice Button */}
                        <div className="pt-4">
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(`/invoices/${result.invoice_id}`)
                            }
                            className="gap-2"
                          >
                            View Full Invoice
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
