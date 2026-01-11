'use client';

import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtendedUser } from '@/types';
import { useEffect, useState } from 'react';
import { getUserById } from '@/lib/actions/user.actions';

interface UserRatingsProps {
  user: ExtendedUser;
}

/**
 * User Ratings Component
 * 
 * Displays the user's ratings as both a seller and as a buyer
 * 
 * @param {UserRatingsProps} props - Component properties
 * @returns {JSX.Element} The rendered user ratings component
 */
export default function UserRatings({ user }: UserRatingsProps) {
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [clientRating, setClientRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the latest user ratings using the existing server action
  useEffect(() => {
    const fetchUserRatings = async () => {
      try {
        setLoading(true);
        
        // Use the existing server action to get the user data
        const userData = await getUserById(user.id);
        
        // Update state with the fetched ratings
        setSellerRating(userData.sellerRating || 0);
        setClientRating(userData.clientRating || 0);
      } catch (error) {
        console.error('Error fetching user ratings:', error);
        
        // Fallback to session values if server action fails
        const getNumericRating = (rating: number | { toString(): string } | null | undefined): number => {
          if (rating === null || rating === undefined) return 0;
          if (typeof rating === 'number') return rating;
          
          // Handle Prisma Decimal or other objects with toString method
          if (typeof rating === 'object' && rating !== null && 'toString' in rating) {
            const parsedValue = parseFloat(rating.toString());
            return isNaN(parsedValue) ? 0 : parsedValue;
          }
          return 0;
        };
        
        setSellerRating(getNumericRating(user.sellerRating));
        setClientRating(getNumericRating(user.clientRating));
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      fetchUserRatings();
    }
  }, [user.id, user.sellerRating, user.clientRating]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Your Ratings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">As a Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    <StarRatingDisplay value={sellerRating} size={20} />
                    <span className="ml-1 text-sm text-muted-foreground">
                      {sellerRating > 0 
                        ? `${sellerRating.toFixed(1)}/5` 
                        : 'Not rated yet'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">As a Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    <StarRatingDisplay value={clientRating} size={20} />
                    <span className="ml-1 text-sm text-muted-foreground">
                      {clientRating > 0 
                        ? `${clientRating.toFixed(1)}/5` 
                        : 'Not rated yet'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
