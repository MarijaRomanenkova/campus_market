'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { acceptProductAssignment } from '@/lib/actions/product-assignment.actions';
import { useRouter } from 'next/navigation';

interface AcceptProductButtonProps {
  productAssignmentId: string;
  className?: string;
}

export default function AcceptProductButton({ productAssignmentId, className = '' }: AcceptProductButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const result = await acceptProductAssignment(productAssignmentId);
      
      if (result.success) {
        toast({
          title: "Product Assignment is Accepted",
          description: "You have successfully accepted this product.",
          variant: "default",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to accept product assignment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error("Error accepting product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAccept}
      disabled={isLoading}
      variant="success"
      size="sm"
      className={className}
    >
      <CheckCircle className="h-4 w-4 mr-2" />
      {isLoading ? "Processing..." : "Accept Product"}
    </Button>
  );
} 
