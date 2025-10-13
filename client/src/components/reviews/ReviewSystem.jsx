import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Star, 
  User, 
  Calendar, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const ReviewSystem = ({ 
  orderId, 
  clientId, 
  onReviewSubmit, 
  existingReviews = [],
  showReviewForm = true 
}) => {
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
    serviceRating: 0,
    itemQualityRating: 0,
    deliveryRating: 0
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleRatingClick = (rating, type = 'overall') => {
    setReviewData(prev => ({
      ...prev,
      [type === 'overall' ? 'rating' : `${type}Rating`]: rating
    }));
  };

  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    try {
      setLoading(true);
      
      const review = {
        orderId,
        clientId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        serviceRating: reviewData.serviceRating,
        itemQualityRating: reviewData.itemQualityRating,
        deliveryRating: reviewData.deliveryRating,
        createdAt: new Date().toISOString()
      };

      await onReviewSubmit(review);
      
      // Reset form
      setReviewData({
        rating: 0,
        comment: '',
        serviceRating: 0,
        itemQualityRating: 0,
        deliveryRating: 0
      });
      
      toast.success('Review submitted successfully');
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, onStarClick, size = 'w-6 h-6', interactive = true) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
            onClick={() => interactive && onStarClick(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (existingReviews.length === 0) return 0;
    const total = existingReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / existingReviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    existingReviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    return distribution;
  };

  const filteredReviews = existingReviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'negative') return review.rating <= 2;
    return true;
  });

  const distribution = getRatingDistribution();
  const averageRating = getAverageRating();

  return (
    <div className="space-y-6">
      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Leave a Review
            </CardTitle>
            <CardDescription>
              Share your experience with this rental
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Rating */}
            <div>
              <Label className="text-base font-medium">Overall Rating</Label>
              <div className="flex items-center gap-3 mt-2">
                {renderStars(
                  hoveredRating || reviewData.rating, 
                  (rating) => handleRatingClick(rating, 'overall')
                )}
                <span className="text-sm text-gray-600">
                  {reviewData.rating > 0 && (
                    reviewData.rating === 5 ? 'Excellent' :
                    reviewData.rating === 4 ? 'Good' :
                    reviewData.rating === 3 ? 'Average' :
                    reviewData.rating === 2 ? 'Poor' : 'Very Poor'
                  )}
                </span>
              </div>
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Service Quality</Label>
                <div className="mt-1">
                  {renderStars(
                    reviewData.serviceRating, 
                    (rating) => handleRatingClick(rating, 'service'),
                    'w-4 h-4'
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm">Item Quality</Label>
                <div className="mt-1">
                  {renderStars(
                    reviewData.itemQualityRating, 
                    (rating) => handleRatingClick(rating, 'itemQuality'),
                    'w-4 h-4'
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm">Delivery/Pickup</Label>
                <div className="mt-1">
                  {renderStars(
                    reviewData.deliveryRating, 
                    (rating) => handleRatingClick(rating, 'delivery'),
                    'w-4 h-4'
                  )}
                </div>
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="review-comment">Comment (Optional)</Label>
              <Textarea
                id="review-comment"
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Tell us about your experience..."
                rows={4}
                className="mt-1"
              />
            </div>

            <Button 
              onClick={handleSubmitReview}
              disabled={loading || reviewData.rating === 0}
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews Overview */}
      {existingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Reviews Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-2">
                  {averageRating}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(parseFloat(averageRating)), () => {}, 'w-5 h-5', false)}
                </div>
                <div className="text-sm text-gray-600">
                  Based on {existingReviews.length} review{existingReviews.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = distribution[rating];
                  const percentage = existingReviews.length > 0 
                    ? (count / existingReviews.length) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {existingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Customer Reviews
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'positive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('positive')}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Positive
                </Button>
                <Button
                  variant={filter === 'negative' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('negative')}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Negative
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReviews.map((review, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {review.client?.name || 'Anonymous'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, () => {}, 'w-4 h-4', false)}
                      <Badge variant={review.rating >= 4 ? 'default' : review.rating >= 3 ? 'secondary' : 'destructive'}>
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>

                  {/* Detailed Ratings */}
                  {(review.serviceRating || review.itemQualityRating || review.deliveryRating) && (
                    <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                      {review.serviceRating > 0 && (
                        <div>
                          <span className="text-gray-600">Service: </span>
                          {renderStars(review.serviceRating, () => {}, 'w-3 h-3', false)}
                        </div>
                      )}
                      {review.itemQualityRating > 0 && (
                        <div>
                          <span className="text-gray-600">Quality: </span>
                          {renderStars(review.itemQualityRating, () => {}, 'w-3 h-3', false)}
                        </div>
                      )}
                      {review.deliveryRating > 0 && (
                        <div>
                          <span className="text-gray-600">Delivery: </span>
                          {renderStars(review.deliveryRating, () => {}, 'w-3 h-3', false)}
                        </div>
                      )}
                    </div>
                  )}

                  {review.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewSystem;
