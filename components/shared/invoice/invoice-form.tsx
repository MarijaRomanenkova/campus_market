'use client';
/**
 * @module InvoiceForm
 * @description A form component for creating or updating invoices.
 * This component handles dynamic invoice item management, total price calculation,
 * and submission of the invoice data.
 */

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema } from "@/lib/validators";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Invoice, InvoiceItems } from "@/types";
import { useState, useEffect } from "react";
import { createInvoice } from "@/lib/actions/invoice.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { getProductAssignmentInvoiceHistory } from "@/lib/actions/product-assignment.actions";
import { useRouter } from "next/navigation";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * @interface InvoiceFormProps
 * @property {'Create' | 'Update'} type - Determines whether the form is for creating or updating an invoice
 * @property {Invoice} [invoice] - Existing invoice data for updates
 * @property {Object} [prefillData] - Optional data to prefill the form
 * @property {string} [prefillData.productId] - Product ID to prefill
 * @property {string} [prefillData.productName] - Product name to prefill
 * @property {string|number} [prefillData.productPrice] - Product price to prefill
 * @property {string} [prefillData.clientId] - Client ID to prefill
 * @property {string} [prefillData.clientName] - Client name to prefill
 * @property {string} [prefillData.sellerId] - Seller ID to prefill
 * @property {string} [prefillData.productAssignmentId] - Product assignment ID to prefill
 */
type InvoiceFormProps = {
  type: 'Create' | 'Update';
  invoice?: Invoice;
  prefillData?: {
    productId?: string;
    productName?: string;
    productPrice?: string | number;
    clientId?: string;
    clientName?: string;
    sellerId?: string;
    sellerName?: string;
    productAssignmentId?: string;
  };
};

/**
 * InvoiceForm component for creating or updating invoices.
 * Handles invoice item management, total price calculation, and form submission.
 * 
 * @param {InvoiceFormProps} props - Component props
 * @returns {JSX.Element} Form for creating or updating invoices
 */
const InvoiceForm = ({ type, invoice, prefillData }: InvoiceFormProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItems[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // New state for existing invoices
  const [existingInvoices, setExistingInvoices] = useState<Array<{
    id: string;
    invoiceNumber: string;
    createdAt: Date;
  }>>([]);

  // Initialize the form with prefill data if available
  const form = useForm<z.infer<typeof insertInvoiceSchema>>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      clientId: prefillData?.clientId || "",
      sellerId: prefillData?.sellerId || "",
      items: prefillData?.productId ? [
        {
          productId: prefillData.productId,
          quantity: 1,
          price: typeof prefillData.productPrice === 'number' 
            ? prefillData.productPrice
            : prefillData.productPrice ? Number(prefillData.productPrice) : 0,
          name: prefillData.productName || "Product Service"
        }
      ] : [],
      totalPrice: typeof prefillData?.productPrice === 'number' 
        ? prefillData.productPrice 
        : prefillData?.productPrice ? Number(prefillData.productPrice) : 0
    }
  });

  // State for storing client and seller details
  const [clientInfo, setClientInfo] = useState({
    name: prefillData?.clientName || "",
    email: ""
  });
  const [sellerInfo, setSellerInfo] = useState({
    name: prefillData?.sellerName || "",
    email: ""
  });

  // Fetch client and seller information
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Fetch client details if we have client ID
        if (prefillData?.clientId) {
          try {
            const clientData = await getUserById(prefillData.clientId);
            setClientInfo({
              name: clientData.name || prefillData.clientName || "",
              email: clientData.email || ""
            });
          } catch (error) {
            console.error("Error fetching client details:", error);
          }
        }

        // Fetch seller details if we have seller ID and don't already have name
        if (prefillData?.sellerId && !prefillData?.sellerName) {
          try {
            const sellerData = await getUserById(prefillData.sellerId);
            setSellerInfo({
              name: sellerData.name || prefillData?.sellerName || "",
              email: sellerData.email || ""
            });
          } catch (error) {
            console.error("Error fetching seller details:", error);
          }
        } else if (prefillData?.sellerName) {
          // If seller name is already provided, just fetch email if needed
          if (prefillData?.sellerId) {
            try {
              const sellerData = await getUserById(prefillData.sellerId);
              setSellerInfo({
                name: prefillData.sellerName,
                email: sellerData.email || ""
              });
            } catch (error) {
              // If fetch fails, at least use the provided name
              setSellerInfo({
                name: prefillData.sellerName,
                email: ""
              });
            }
          } else {
            // Just use the provided name if no ID to fetch email
            setSellerInfo({
              name: prefillData.sellerName,
              email: ""
            });
          }
        }
      } catch (error) {
        console.error("Error in fetchUserDetails:", error);
      }
    };

    fetchUserDetails();
  }, [prefillData?.clientId, prefillData?.sellerId, prefillData?.clientName, prefillData?.sellerName]);

  // Initialize invoice items based on prefill data
  useEffect(() => {
    if (prefillData?.productId) {
      const initialItem = {
        productId: prefillData.productId,
        name: prefillData.productName || "Product Service",
        price: typeof prefillData.productPrice === 'number' 
          ? prefillData.productPrice.toFixed(2) 
          : prefillData.productPrice || "0.00",
        qty: 1
      };
      setInvoiceItems([initialItem]);
      
      // Set initial total price
      const price = typeof prefillData.productPrice === 'number' 
        ? prefillData.productPrice 
        : parseFloat(prefillData.productPrice || "0");
      setTotalPrice(price);
    }
  }, [prefillData]);

  // Check for existing invoices when product assignment ID is available
  useEffect(() => {
    const checkForExistingInvoices = async () => {
      const productAssignmentId = prefillData?.productAssignmentId;
      
      // Validate that productAssignmentId exists and is a non-empty string
      if (!productAssignmentId || typeof productAssignmentId !== 'string' || productAssignmentId.trim() === '') {
        return;
      }

      try {
        const history = await getProductAssignmentInvoiceHistory(productAssignmentId);
        if (history && history.invoiced && Array.isArray(history.invoices)) {
          setExistingInvoices(history.invoices);
        }
      } catch (error) {
        // Silently handle errors - if the check fails, we'll just not show existing invoices
        // This prevents console noise for non-critical errors
        // Reset to empty array on error
        setExistingInvoices([]);
      }
    };

    checkForExistingInvoices();
  }, [prefillData?.productAssignmentId]);

  /**
   * Adds a new empty invoice item to the form.
   */
  const handleAddItem = () => {
    try {
      // Create a new item for the local state
      const newItem = {
        productId: "",
        name: "Service description",
        price: "0.00",
        qty: 1
      };
      
      // Create the matching form item with the correct schema structure
      const formItem = {
        productId: newItem.productId,
        quantity: newItem.qty, // Match the form schema field 'quantity' instead of 'qty'
        price: parseFloat(newItem.price),
        name: newItem.name
      };
      
      // First update the local state for UI rendering
      const updatedItems = [...invoiceItems, newItem];
      setInvoiceItems(updatedItems);
      
      // Then update the form value with all items
      const currentItems = form.getValues("items") || [];
      form.setValue("items", [...currentItems, formItem]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add invoice item",
        variant: "destructive",
      });
    }
  };

  /**
   * Removes an invoice item from the form at the specified index.
   * Recalculates total price after removal.
   * 
   * @param {number} index - The index of the item to remove
   */
  const handleRemoveItem = (index: number) => {
    try {
      // Update local state by filtering out the item at the specified index
      const updatedItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(updatedItems);
      
      // Transform UI items to match form schema format
      const formItems = updatedItems.map(item => ({
        productId: item.productId,
        quantity: item.qty || 1,  // Field 'quantity' in form schema matches 'qty' in UI
        price: parseFloat(item.price),
        name: item.name
      }));
      
      // Update form values
      form.setValue("items", formItems);
      
      // Recalculate total price
      const total = updatedItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * (item.qty || 1));
      }, 0);
      setTotalPrice(total);
      form.setValue("totalPrice", total);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove invoice item",
        variant: "destructive",
      });
    }
  };

  /**
   * Updates a specific field of an invoice item at the specified index.
   * Recalculates total price if price or quantity changes.
   * 
   * @param {number} index - The index of the item to update
   * @param {string} field - The field name to update (productId, name, price, qty)
   * @param {string | number} value - The new value for the field
   */
  const handleItemChange = (index: number, field: string, value: string | number) => {
    try {
      // Make a copy of the current items
      const updatedItems = [...invoiceItems];
      
      // Update the specific field in the local state
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setInvoiceItems(updatedItems);
      
      // Transform UI items to match form schema format, ensuring all fields are synced
      const formItems = updatedItems.map((item, idx) => {
        // Get existing form item if it exists, otherwise create new one
        const existingFormItem = form.getValues("items")?.[idx] || {};
        return {
          productId: item.productId || existingFormItem.productId || "",
          quantity: item.qty || existingFormItem.quantity || 1,
          price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || existingFormItem.price || 0),
          name: item.name || existingFormItem.name || "Service description"
        };
      });
      
      // Update the form with all items
      form.setValue("items", formItems);
      
      // Recalculate total price for price or quantity changes
      if (field === 'price' || field === 'qty') {
        const total = updatedItems.reduce((sum, item) => {
          const itemPrice = parseFloat(String(item.price));
          const itemQty = item.qty || 1;
          return sum + (itemPrice * itemQty);
        }, 0);
        setTotalPrice(total);
        form.setValue("totalPrice", total);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update item ${index}, field ${field}`,
        variant: "destructive",
      });
    }
  };

  /**
   * Handles form submission, creating a new invoice with the entered data.
   * Displays a toast notification on success or failure.
   * 
   * @param {z.infer<typeof insertInvoiceSchema>} values - The form values
   */
  const handleSubmit = async (values: z.infer<typeof insertInvoiceSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Ensure all items have names from the UI state (invoiceItems)
      // Sync form items with invoiceItems to include all names
      const syncedItems = invoiceItems.map((item, index) => {
        const formItem = values.items[index] || {};
        return {
          ...formItem,
          productId: item.productId || formItem.productId || "",
          quantity: item.qty || formItem.quantity || 1,
          price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || formItem.price || 0),
          name: item.name || formItem.name || "Service description"
        };
      });
      
      // Create the final values with synced items
      const finalValues = {
        ...values,
        items: syncedItems
      };
      
      const result = await createInvoice(finalValues);
      if (result.success && result.data?.invoiceNumber) {
        toast({
          title: 'Invoice created',
          description: 'The invoice has been created successfully.',
        });
        router.push(`/user/dashboard/seller/invoices/${result.data.invoiceNumber}`);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {existingInvoices.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Previous invoices exist</AlertTitle>
            <AlertDescription>
              This product assignment already has {existingInvoices.length} invoice(s). 
              Creating an additional invoice might be needed for corrections or credit notes, but could lead to duplicate billing.
              <div className="mt-2">
                <strong>Existing invoices:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {existingInvoices.map((invoice, index) => {
                    const dateStr = invoice.createdAt 
                      ? new Date(invoice.createdAt).toLocaleDateString() 
                      : 'Unknown date';
                    return (
                      <li key={`${invoice.id}-${index}`}>
                        Invoice #{invoice.invoiceNumber || 'N/A'} - Created on {dateStr}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-4">Client Information</h3>
            <div className="space-y-4">
              {/* Hide client ID but keep it in the form data */}
              <input 
                type="hidden" 
                {...form.register("clientId")} 
                value={prefillData?.clientId || ""}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Client Name</FormLabel>
                  <Input 
                    value={clientInfo.name} 
                    onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                    placeholder="Client Name" 
                    readOnly={Boolean(prefillData?.clientName)}
                  />
                </div>
                <div>
                  <FormLabel>Client Email</FormLabel>
                  <Input 
                    value={clientInfo.email} 
                    onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                    placeholder="Client Email" 
                    readOnly={Boolean(clientInfo.email)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Seller Information */}
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-4">Seller Information</h3>
            <div className="space-y-4">
              {/* Hide seller ID but keep it in the form data */}
              <input 
                type="hidden" 
                {...form.register("sellerId")} 
                value={prefillData?.sellerId || ""}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Seller Name</FormLabel>
                  <Input 
                    value={sellerInfo.name} 
                    onChange={(e) => setSellerInfo({...sellerInfo, name: e.target.value})}
                    placeholder="Seller Name" 
                    readOnly={Boolean(sellerInfo.name)}
                  />
                </div>
                <div>
                  <FormLabel>Seller Email</FormLabel>
                  <Input 
                    value={sellerInfo.email} 
                    onChange={(e) => setSellerInfo({...sellerInfo, email: e.target.value})}
                    placeholder="Seller Email" 
                    readOnly={Boolean(sellerInfo.email)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoice Items Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={`invoice-item-${index}`}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {/* Hidden product ID field */}
                    <input 
                      type="hidden"
                      value={item.productId} 
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    />
                    <Input 
                      value={item.name} 
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full"
                      placeholder="Service description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={item.price} 
                      onChange={(e) => {
                        // Convert to a proper number and handle validation
                        const value = e.target.value;
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleItemChange(index, 'price', value);
                        } else if (value === '') {
                          // Allow empty field during typing
                          handleItemChange(index, 'price', '0');
                        }
                      }}
                      step="0.01"
                      min="0"
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {invoiceItems.length > 1 ? (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="px-2">
                        {/* No delete button when there's only one item */}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoiceItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No invoice items added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between items-center">
          <Button type="button" onClick={handleAddItem} variant="outline">
            Add Item
          </Button>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total:</p>
            <p className="text-lg font-semibold">{formatCurrency(totalPrice)}</p>
            <Input 
              type="hidden" 
              {...form.register("totalPrice")} 
              value={totalPrice.toFixed(2)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {type === 'Create' ? 'Create Invoice' : 'Update Invoice'}
        </Button>
      </form>
    </Form>
  );
};

export default InvoiceForm; 
