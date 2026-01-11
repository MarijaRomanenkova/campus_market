/**
 * Review Student Dialog Component
 * @module Components
 * @group Shared/ProductAssignment
 * 
 * A client-side dialog component that allows users to review their students.
 * Features include:
 * - Star rating system
 * - Optional feedback text
 * - Loading states
 * - Error handling with toast notifications
 * - Automatic refresh after submission
 * 
 * @example
 * ```tsx
 * <ReviewStudentDialog
 *   productAssignmentId="product123"
 *   studentName="Jane Smith"
 * >
 *   <Button>Review Student</Button>
 * </ReviewStudentDialog>
 * ```
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/hooks/use-toast";
import { markProductAsReviewed } from "@/lib/actions/product-assignment.actions";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

/**
 * Props for the ReviewStudentDialog component
 * @interface ReviewStudentDialogProps
 */
interface ReviewStudentDialogProps {
  /** Unique identifier of the product assignment */
  productAssignmentId: string;
  /** Name of the student being reviewed */
  studentName: string;
  /** Optional trigger element to open the dialog */
  children?: ReactNode;
}

/**
 * ReviewStudentDialog component that provides a form for reviewing students.
 * Allows users to provide ratings and feedback about their students.
 * 
 * @param {ReviewStudentDialogProps} props - Component properties
 * @returns {JSX.Element} A dialog with a review form
 */
export default function ReviewStudentDialog({ productAssignmentId, studentName, children }: ReviewStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await markProductAsReviewed(productAssignmentId, rating, feedback);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Review submitted successfully. A notification has been sent to the student."
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit review",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="default" className="w-full">
            Review Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Review Student: {studentName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="rating" className="text-sm font-medium leading-none">
              Rating
            </label>
            <StarRating
              value={rating}
              onChange={setRating}
              size={24}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="feedback" className="text-sm font-medium leading-none">
              Feedback (optional)
            </label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with this student..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
