/**
 * Invoice List Table Component
 * @module Components
 * @group Shared/Invoice
 * 
 * A comprehensive table component for displaying invoice lists with different views
 * for clients and sellers. The component includes functionality for:
 * - Selecting invoices for batch payment processing (client view)
 * - Viewing invoice details
 * - Managing invoice status
 * - Handling payment processing
 * 
 * @example
 * ```tsx
 * <InvoiceListTable
 *   invoices={[
 *     {
 *       id: "inv-123",
 *       invoiceNumber: "INV-001",
 *       totalPrice: "100.00",
 *       isPaid: false,
 *       createdAt: new Date()
 *     }
 *   ]}
 *   userType="client"
 * />
 * ```
 */

'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Edit, Trash, CheckCircle, Clock, CreditCard, FileText, CheckSquare, Square, ArrowRight, Loader, MessageSquare, ChevronLeft, ChevronRight, Eye, Link2, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { getProductAssignmentByInvoiceNumber } from "@/lib/actions/product-assignment.actions";

/**
 * Props for the InvoiceListTable component
 * @interface InvoiceListTableProps
 */
interface InvoiceListTableProps {
  /** Array of invoice objects to display in the table */
  invoices: Invoice[];
  /** The type of user viewing the table, determines available actions */
  userType: 'client' | 'seller';
  /** Optional callback function for editing an invoice */
  onEdit?: (invoice: Invoice) => void;
  /** Optional callback function for deleting an invoice */
  onDelete?: (invoice: Invoice) => void;
}

/**
 * Helper function to truncate text to a specified length and add ellipsis if needed.
 * 
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} The truncated text with ellipsis if applicable
 */
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Helper function to format a date object as DD-MM-YYYY string.
 * 
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
const formatDateAsDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * ContactButton Component
 * 
 * A button that handles navigation to the appropriate conversation
 * for a specific invoice and product. Uses the Conversations API to
 * find existing conversations or create new ones.
 * 
 * @param {Object} props - Component props
 * @param {string} props.productId - ID of the product related to the invoice
 * @param {string} props.clientId - ID of the client
 * @param {string} props.sellerId - ID of the seller
 * @param {'client'|'seller'} props.userType - User role viewing the invoice
 * @returns {JSX.Element} A button that navigates to the conversation
 */
function ContactButton({ 
  productId, 
  clientId, 
  sellerId, 
  userType 
}: { 
  productId: string; 
  clientId: string; 
  sellerId: string; 
  userType: 'client' | 'seller' 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContact = async () => {
    try {
      setIsLoading(true);
      
      // First, check if a conversation already exists for this product
      const response = await fetch(`/api/conversations?productId=${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check for existing conversations');
      }
      
      const conversations = await response.json();
      
      if (conversations && conversations.length > 0) {
        // Conversation exists, navigate to it
        router.push(`/user/dashboard/messages/${conversations[0].id}`);
      } else {
        // No existing conversation, create a new one
        const createResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            participantIds: [userType === 'seller' ? clientId : sellerId]
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create conversation');
        }
        
        const newConversation = await createResponse.json();
        router.push(`/user/dashboard/messages/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Error navigating to conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open conversation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleContact}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * InvoiceListTable Component
 * 
 * Renders a table of invoices with different functionality based on user type:
 * - For clients: Includes invoice selection for batch payment processing
 * - For sellers: Shows invoice management options
 * 
 * Features:
 * - Pagination support
 * - Invoice selection for batch payments
 * - Payment status indicators
 * - Action buttons for viewing, editing, and deleting invoices
 * - Payment processing integration
 * 
 * @param {InvoiceListTableProps} props - Component properties
 * @returns {JSX.Element} Table component with invoice list and payment summary
 */
const InvoiceListTable = ({ 
  invoices, 
  userType, 
  onEdit,
  onDelete 
}: InvoiceListTableProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // State to track selected invoices
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5;
  
  // Calculate total price of selected invoices
  const totalPrice = selectedInvoices.reduce((sum, invoice) => sum + Number(invoice.totalPrice), 0);

  // Calculate pagination values
  const totalPages = Math.ceil(invoices.length / invoicesPerPage);
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  
  /**
   * Handles page change in the invoice list
   * @param {number} pageNumber - The page number to navigate to
   */
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  /**
   * Toggles selection state of an invoice for payment
   * Prevents selection of already paid invoices
   * 
   * @param {Invoice} invoice - The invoice to toggle selection for
   */
  const toggleInvoiceSelection = (invoice: Invoice) => {
    if (invoice.isPaid) return;
    
    setSelectedInvoices(prev => {
      const isSelected = prev.some(item => item.id === invoice.id);
      
      if (isSelected) {
        return prev.filter(item => item.id !== invoice.id);
      } else {
        return [...prev, invoice];
      }
    });
  };

  /**
   * Handles proceeding to payment with selected invoices
   * Stores selected invoice IDs in session storage and navigates to payment page
   */
  const handleProceedToPayment = () => {
    if (selectedInvoices.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Please select at least one invoice to pay',
      });
      return;
    }

    startTransition(async () => {
      sessionStorage.setItem('selectedInvoices', JSON.stringify(selectedInvoices.map(inv => inv.id)));
      router.push('/user/dashboard/client/payments/checkout');
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Payment Summary - Client View */}
      {userType === 'client' && (
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Summary</h3>
              
              <div className="flex items-center gap-4">
                {selectedInvoices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                )}
                
                <Button
                  variant="success"
                  size="sm"
                  disabled={isPending || selectedInvoices.length === 0}
                  onClick={handleProceedToPayment}
                >
                  {isPending ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    
      {/* Invoice Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {userType === 'client' && (
                <TableHead className="w-12">
                  <span className="sr-only">Select</span>
                </TableHead>
              )}
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                {userType === 'client' && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleInvoiceSelection(invoice)}
                      disabled={invoice.isPaid}
                    >
                      {selectedInvoices.some(item => item.id === invoice.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                )}
                <TableCell>
                  <Link href={`/user/dashboard/${userType}/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>{formatDateTime(invoice.createdAt)}</TableCell>
                <TableCell>{formatCurrency(Number(invoice.totalPrice))}</TableCell>
                <TableCell>
                  <Badge variant={invoice.isPaid ? "success" : "warning"}>
                    {invoice.isPaid ? "Paid" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/user/dashboard/${userType}/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {userType === 'seller' && onEdit && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(invoice)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Invoice</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {userType === 'seller' && onDelete && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(invoice)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Invoice</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvoiceListTable; 
