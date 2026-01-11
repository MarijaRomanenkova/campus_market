'use client';

/**
 * @module InvoiceItemForm
 * @description A form component for rendering and managing individual invoice line items.
 * This component is used within the invoice form to handle the entry of product details and quantities.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { invoiceSchema } from "@/lib/validators";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";


// Extract the item type from the invoiceSchema
type InvoiceItemType = z.infer<typeof invoiceSchema>["items"][number];

/**
 * @interface InvoiceItemFormProps
 * @property {number} index - The index of this item in the array of invoice items
 * @property {Function} onRemove - Callback function to remove this item from the invoice
 * @property {UseFormReturn} form - The react-hook-form object that contains the form state and methods
 */
type InvoiceItemFormProps = {
  index: number;
  onRemove: () => void;
  form: UseFormReturn<{
    invoiceItem: InvoiceItemType[]; // Using the item type from the imported schema
    // ... other form fields
  }>;
};

/**
 * InvoiceItemForm component for rendering an individual invoice line item input form.
 * Allows users to input product ID and quantity information for a single invoice item.
 * 
 * @param {Object} props - Component props
 * @param {number} props.index - The index of this item in the invoice items array
 * @param {Function} props.onRemove - Function to call when removing this item
 * @param {UseFormReturn} props.form - The parent form object from react-hook-form
 * @returns {JSX.Element} Form fields for a single invoice item with a remove button
 */
const InvoiceItemForm = ({ index, onRemove, form }: InvoiceItemFormProps) => {
  return (
    <div className="border p-4 rounded-lg mb-4 bg-card">
      <FormField
        control={form.control}
        name={`invoiceItem.${index}.productId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`invoiceItem.${index}.quantity`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button 
        type="button" 
        variant="destructive" 
        onClick={onRemove}
        className="mt-2"
      >
        Remove Item
      </Button>
    </div>
  );
};

export default InvoiceItemForm; 
