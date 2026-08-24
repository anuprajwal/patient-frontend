import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function DoctorReviewsSection({ reviews = [], reviewsPerPage = 3 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  return (
    <div className="border-t border-slate-100 pt-6 space-y-4">
      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Clinical Feedback Logs</span>
      <div className="space-y-3">
        {currentReviews.map((rev) => (
          <div key={rev.id} className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {new Date(rev.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">"{rev.review_text}"</p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-semibold text-slate-400">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40"
            >
              Prev
            </button>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}