'use client';

/**
 * Invoice Creation Page Component
 * @module Pages
 * @group Dashboard/Seller
 * 
 * This client-side page allows sellers to create new invoices.
 * It supports pre-filling data from product and client information passed via URL parameters.
 */

import InvoiceForm from '@/components/shared/invoice/invoice-form';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getProductById } from '@/lib/actions/product.actions';
import { getUserById } from '@/lib/actions/user.actions';

/**
 * Interface for the prefill data used in invoice creation
 * @interface PrefillData
 * @property {string} [sellerId] - ID of the seller creating the invoice
 * @property {string} [productId] - ID of the product for the invoice
 * @property {string} [productName] - Name of the product
 * @property {number|string} [productPrice] - Price of the product (always converted to number/string, never Decimal)
 * @property {string} [clientId] - ID of the client for the invoice
 * @property {string} [clientName] - Name of the client
 * @property {string} [productAssignmentId] - ID of the product assignment
 */
interface PrefillData {
  sellerId?: string;
  sellerName?: string;
  productId?: string;
  productName?: string;
  productPrice?: number | string; // Never Decimal - always converted to number/string
  clientId?: string;
  clientName?: string;
  productAssignmentId?: string;
}

/**
 * Helper function to safely convert a value to a number
 * Handles Prisma Decimal objects and other numeric types
 * This ensures we never pass Decimal objects to Client Components
 */
const safeToNumber = (value: unknown): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  if (typeof value === 'object') {
    // Check if it's a Prisma Decimal with toNumber method
    if ('toNumber' in value && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
      try {
        const num = (value as { toNumber(): number }).toNumber();
        return isNaN(num) ? 0 : num;
      } catch {
        // Fall through to toString method
      }
    }
    
    // Fallback: try toString method for any object-like value
    if ('toString' in value && typeof (value as { toString?: unknown }).toString === 'function') {
      try {
        const str = (value as { toString(): string }).toString();
        const parsed = parseFloat(str);
        if (!isNaN(parsed)) {
          return parsed;
        }
      } catch {
        return 0;
      }
    }
  }
  
  return 0;
};

/**
 * Creates a clean PrefillData object with only serializable values
 * Ensures no Decimal objects or functions are passed to Client Components
 * Always converts productPrice to a number (never Decimal, never string unless explicitly converted later)
 */
const createCleanPrefillData = (data: Partial<PrefillData>): PrefillData => {
  // Ensure productPrice is always converted to number (never Decimal)
  let cleanProductPrice: number | string | undefined = undefined;
  if (data.productPrice !== undefined && data.productPrice !== null) {
    // Convert to number first, then we can convert to string later if needed
    cleanProductPrice = safeToNumber(data.productPrice);
  }
  
  return {
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    productId: data.productId,
    productName: data.productName,
    productPrice: cleanProductPrice,
    clientId: data.clientId,
    clientName: data.clientName,
    productAssignmentId: data.productAssignmentId
  };
};

/**
 * Create Invoice Page Component
 * 
 * Renders a form for creating new invoices with:
 * - Optional pre-filling from product details
 * - Optional pre-filling from client details
 * - Automatic seller association
 * 
 * Uses URL search parameters to determine what data to pre-fill.
 * Fetches related product and client data to populate the form.
 * Shows a loading state while fetching data.
 * 
 * @returns {JSX.Element} The rendered invoice creation form
 */
const CreateInvoicePage = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const clientId = searchParams.get('clientId');
  const productAssignmentId = searchParams.get('productAssignmentId');
  const isAdditional = searchParams.get('isAdditional') === 'true';
  const { data: session } = useSession();
  
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches product and client data to pre-fill the invoice form
   * Runs when component mounts and when session, productId, or clientId change
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Initialize data with seller ID from session
        const data: PrefillData = {
          sellerId: session?.user?.id,
          productAssignmentId: productAssignmentId || undefined
        };
        
        // Fetch data using simpler, more reliable server actions
        // We use getUserById and getProductById directly to avoid serialization issues
        // with getProductAssignmentById (which has Decimal serialization problems)
        
        // If we have a client ID, fetch client details
        if (clientId) {
          try {
            const clientDetails = await getUserById(clientId);
            if (clientDetails) {
              data.clientId = clientId;
              data.clientName = clientDetails.name;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error fetching client details:', errorMessage);
          }
        }
        
        // If we have a product ID, fetch product details
        if (productId) {
          try {
            const productDetails = await getProductById(productId);
            if (productDetails) {
              data.productId = productId;
              // If this is an additional invoice, override the product name
              data.productName = isAdditional 
                ? "Additional Service" 
                : productDetails.name;
              // getProductById already returns price as a number, but ensure it's safe
              data.productPrice = safeToNumber(productDetails.price);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error fetching product details:', errorMessage);
          }
        }
        
        // Fetch seller name from session user
        if (session?.user?.id) {
          data.sellerId = session.user.id;
          // Fetch seller name if not already set
          if (!data.sellerName) {
            try {
              const sellerDetails = await getUserById(session.user.id);
              if (sellerDetails) {
                data.sellerName = sellerDetails.name;
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error('Error fetching seller details:', errorMessage);
            }
          }
        }
        
        // Ensure all values are serializable (no Decimal objects or functions)
        // Create a clean object with only primitive values
        // Also ensure productPrice is definitely converted
        const cleanedData = createCleanPrefillData(data);
        
        // Double-check that productPrice is a number (not Decimal, string, or undefined)
        if (cleanedData.productPrice !== undefined) {
          cleanedData.productPrice = safeToNumber(cleanedData.productPrice);
        }
        
        setPrefillData(cleanedData);
      } catch (error) {
        // Log error message only, not the error object (which might contain Decimal objects)
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching prefill data:", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user?.id) {
      fetchData();
    }
  }, [productId, clientId, session, productAssignmentId, isAdditional]);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading invoice data...</div>;
  }
  
  // Ensure all values are properly serialized for the InvoiceForm component
  // Convert productPrice to string, but first ensure it's a number (not Decimal)
  // Also ensure all other fields are primitive values (no nested objects that might contain Decimals)
  const formattedPrefillData = prefillData ? createCleanPrefillData({
    ...prefillData,
    productPrice: prefillData.productPrice !== undefined 
      ? safeToNumber(prefillData.productPrice) 
      : undefined
  }) : undefined;
  
  return (
    <>
      <h2 className='h2-bold'>Create Invoice</h2>
      <div className='my-8'>
        <InvoiceForm type='Create' prefillData={formattedPrefillData} />
      </div>
    </>
  );
};

export default CreateInvoicePage;
