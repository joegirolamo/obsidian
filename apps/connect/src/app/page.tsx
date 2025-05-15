"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ObsidianLogo from '@/components/ObsidianLogo';

interface VerifyResponse {
  businessId: string;
  hasPublishedItems: boolean;
  publishedTypes: {
    scorecard: boolean;
    opportunities: boolean;
  };
}

interface ErrorResponse {
  error: string;
}

export default function AccessCodeEntry() {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ErrorResponse).error || "Invalid access code");
      }

      // Redirect based on whether there are published items
      const verifiedData = data as VerifyResponse;
      if (verifiedData.hasPublishedItems) {
        router.push(`/portal/${verifiedData.businessId}/dashboard`);
      } else {
        router.push(`/portal/${verifiedData.businessId}/metrics`);
      }
    } catch (err) {
      setError("Invalid access code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ObsidianLogo className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Obsidian</h1>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter your access code"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !accessCode}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
