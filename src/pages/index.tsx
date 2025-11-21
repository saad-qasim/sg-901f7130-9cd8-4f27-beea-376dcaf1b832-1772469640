
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Package, 
  Users, 
  ShoppingBag, 
  Search,
  Sparkles 
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const features = [
    {
      title: "Invoices",
      description: "Create, view, and manage invoices with automatic calculations",
      icon: FileText,
      href: "/invoices",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Brands",
      description: "Manage product brands with logos and warranty information",
      icon: Sparkles,
      href: "/brands",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Products",
      description: "Add and organize products with pricing and specifications",
      icon: Package,
      href: "/products",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Customers",
      description: "Store customer information and contact details",
      icon: Users,
      href: "/customers",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Serial Search",
      description: "Look up warranty and invoice details by device serial number",
      icon: Search,
      href: "/search-serial",
      color: "text-pink-600 dark:text-pink-400"
    }
  ];

  return (
    <>
      <Head>
        <title>Invoice PRO - Invoicing Management System</title>
        <meta name="description" content="Full-stack invoicing web app for managing brands, products, customers, and invoices" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Invoice PRO
            </h1>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
              Complete invoicing solution for your business
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg"
                onClick={() => router.push("/invoices/new")}
                className="gap-2 text-lg px-8"
              >
                <FileText size={20} />
                Create Invoice
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => router.push("/search-serial")}
                className="gap-2 text-lg px-8"
              >
                <Search size={20} />
                Search Device
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.href}
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 group"
                  onClick={() => router.push(feature.href)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-3 rounded-lg bg-muted group-hover:scale-110 transition-transform ${feature.color}`}>
                        <Icon size={28} />
                      </div>
                      <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary/10"
                    >
                      Open {feature.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Stats or Additional Info */}
          <div className="mt-16 text-center">
            <Card className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2">
              <CardHeader>
                <CardTitle className="text-3xl">Features Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">∞</div>
                    <div className="text-sm text-muted-foreground mt-2">Unlimited Invoices</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">2</div>
                    <div className="text-sm text-muted-foreground mt-2">Currency Support</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400">✓</div>
                    <div className="text-sm text-muted-foreground mt-2">Warranty Tracking</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-pink-600 dark:text-pink-400">⚡</div>
                    <div className="text-sm text-muted-foreground mt-2">Fast Search</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
