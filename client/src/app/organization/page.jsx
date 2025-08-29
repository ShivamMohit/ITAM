"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import organizationService from "../../lib/organizationService";
import { Building, Users, HardDrive, Calendar, Shield } from "lucide-react";

export default function OrganizationPage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        setLoading(true);
        const [orgData, statsData] = await Promise.all([
          organizationService.getOrganizationDetails(),
          organizationService.getOrganizationStats(),
        ]);
        setOrganization(orgData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load organization data:", err);
        setError("Failed to load organization information");
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Shield className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">
            <Building className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Organization Found
          </h2>
          <p className="text-gray-600">
            You are not associated with any organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
          </div>
          <p className="text-gray-600">
            Manage your organization settings and view subscription details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Organization Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Organization Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {organization.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Domain
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {organization.domain}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Created
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {new Date(organization.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Subscription
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Current Plan
                    </label>
                    <p className="mt-1 text-lg font-medium text-gray-900 capitalize">
                      {organization.subscription.plan}
                    </p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <span
                      className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        organization.subscription.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {organization.subscription.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Asset Limit
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {organization.subscription.maxAssets} assets
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Features
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {organization.subscription.features.map(
                      (feature, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {feature.replace("_", " ")}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Usage Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Users
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.users || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Assets
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.assets || 0} / {organization.subscription.maxAssets}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Usage
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.usagePercentage || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  View Subscription Details
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                  Manage Users
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                  Organization Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
