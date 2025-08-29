"use client";

import { XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SubscriptionCancelPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subscription Cancelled
          </h1>

          <p className="text-gray-600 mb-6">
            You've cancelled the subscription process. No charges have been made
            to your account. You can return to the pricing page anytime to try
            again.
          </p>

          <div className="space-y-3">
            <Link
              href="/subscription"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Link>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Have questions? Our support team is here to help you choose the
              right plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelPage;

