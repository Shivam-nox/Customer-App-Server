import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { ObjectUploader } from "@/components/ObjectUploader";
import LoadingSpinner from "@/components/loading-spinner";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Upload,
  FileText,
  CreditCard,
  Award,
} from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface KycDocument {
  type: "gst" | "pan" | "license";
  name: string;
  description: string;
  icon: React.ReactNode;
  uploaded: boolean;
  url?: string;
}

export default function KycUploadScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState<KycDocument[]>([
    {
      type: "gst",
      name: "GST Certificate",
      description: "Required for business verification",
      icon: <FileText size={24} />,
      uploaded: false,
    },
    {
      type: "pan",
      name: "PAN Card",
      description: "Business PAN verification",
      icon: <CreditCard size={24} />,
      uploaded: false,
    },
    {
      type: "license",
      name: "Business License",
      description: "Valid business operation license",
      icon: <Award size={24} />,
      uploaded: false,
    },
  ]);

  const uploadUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/kyc/upload-url");
      return response.json();
    },
  });

  const updateKycMutation = useMutation({
    mutationFn: async (data: { documents: Record<string, string> }) => {
      const response = await apiRequest("PUT", "/api/kyc/documents", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "KYC documents submitted for verification",
      });
      refetchUser();
      setLocation("/home");
    },

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit KYC documents",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const result = await uploadUrlMutation.mutateAsync();
    return {
      method: "PUT" as const,
      url: result.uploadURL,
    };
  };

  const handleUploadComplete =
    (docType: string) =>
    (
      result: UploadResult<Record<string, unknown>, Record<string, unknown>>
    ) => {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const fileUrl = uploadedFile.uploadURL;

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.type === docType
              ? { ...doc, uploaded: true, url: fileUrl }
              : doc
          )
        );

        toast({
          title: "Upload Successful",
          description: `${
            documents.find((d) => d.type === docType)?.name
          } uploaded successfully`,
        });
      }
    };

  const handleSubmitKyc = async () => {
    const uploadedDocs = documents.filter((doc) => doc.uploaded);

    if (uploadedDocs.length < 3) {
      toast({
        title: "Incomplete Documents",
        description: "Please upload all required documents",
        variant: "destructive",
      });
      return;
    }

    const docUrls: Record<string, string> = {};
    uploadedDocs.forEach((doc) => {
      if (doc.url) {
        docUrls[doc.type] = doc.url;
      }
    });

    updateKycMutation.mutate({ documents: docUrls });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="kyc-upload-screen">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mr-3"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium" data-testid="page-title">
          Complete KYC
        </h2>
      </div>

      <div className="p-4 pb-6">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
            <Shield className="text-white" size={40} />
          </div>
          <h3
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3"
            data-testid="verify-title"
          >
            Verify Your Business
          </h3>
          <p
            className="text-gray-600 text-base sm:text-lg px-4"
            data-testid="verify-description"
          >
            Upload required documents to complete verification
          </p>

          {/* Progress Indicator */}
          <div className="mt-6 sm:mt-8 mb-2">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 px-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Upload
                </span>
              </div>
              <div className="w-6 sm:w-10 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-400">
                  Review
                </span>
              </div>
              <div className="w-6 sm:w-10 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-400">
                  Approved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Cards */}
        <div className="space-y-5 mb-8">
          {documents.map((doc, index) => (
            <Card
              key={doc.type}
              className={`border-2 transition-all duration-200 overflow-hidden ${
                doc.uploaded
                  ? "border-green-300 bg-green-50/40 shadow-md"
                  : "border-gray-300 hover:border-blue-300 hover:shadow-lg"
              }`}
            >
              <CardContent className="p-5 sm:p-6">
                {/* Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        doc.uploaded
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {doc.uploaded ? <CheckCircle size={28} /> : doc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-bold text-gray-900 text-lg sm:text-xl mb-1.5"
                        data-testid={`${doc.type}-title`}
                      >
                        {doc.name}
                      </h4>
                      <p
                        className="text-gray-600 text-sm sm:text-base"
                        data-testid={`${doc.type}-description`}
                      >
                        {doc.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 self-start ${
                      doc.uploaded
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {doc.uploaded ? "✓ Uploaded" : `Step ${index + 1} of 3`}
                  </div>
                </div>

                {/* Upload Area */}
                {!doc.uploaded ? (
                  <div className="mt-4">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete(doc.type)}
                      buttonClassName="w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-400 rounded-2xl py-6 px-4 text-center hover:from-blue-50 hover:to-blue-100 hover:border-blue-500 transition-all duration-300 group shadow-sm hover:shadow-md min-h-[200px] flex items-center justify-center"
                    >
                      <div
                        className="flex flex-col items-center justify-center space-y-3 w-full"
                        data-testid={`${doc.type}-upload-button`}
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                          <Upload
                            className="text-blue-600 group-hover:text-blue-700"
                            size={28}
                          />
                        </div>
                        <div className="text-center space-y-2 w-full max-w-xs mx-auto">
                          <h6 className="text-base font-bold text-gray-900">
                            Drag & drop or click to upload
                          </h6>
                          <p className="text-sm text-gray-700 font-semibold">
                            {doc.name}
                          </p>
                        </div>
                        <div className="text-center space-y-1 pt-1">
                          <p className="text-xs text-gray-600">
                            Supported: PDF, JPG, PNG
                          </p>
                          <p className="text-xs text-gray-600">Max size: 5MB</p>
                        </div>
                      </div>
                    </ObjectUploader>
                  </div>
                ) : (
                  <div className="mt-4 w-full bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 text-center shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <CheckCircle className="text-green-600" size={32} />
                      <div className="text-center sm:text-left">
                        <p className="text-green-800 font-bold text-base sm:text-lg">
                          Document uploaded successfully
                        </p>
                        <p className="text-green-700 text-sm">
                          Ready for verification
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="space-y-5">
          <Button
            onClick={handleSubmitKyc}
            className={`w-full h-16 sm:h-14 text-base sm:text-lg font-bold ripple transition-all duration-200 rounded-xl ${
              documents.filter((d) => d.uploaded).length === 3
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
                : "bg-gray-400 cursor-not-allowed opacity-60"
            }`}
            disabled={
              updateKycMutation.isPending ||
              documents.filter((d) => d.uploaded).length < 3
            }
            data-testid="submit-kyc-button"
          >
            {updateKycMutation.isPending ? (
              <div className="flex items-center justify-center space-x-3">
                <LoadingSpinner />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <Shield size={22} />
                <span>Submit for Verification</span>
              </div>
            )}
          </Button>

          {/* Progress Summary */}
          <div className="text-center bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-base sm:text-lg font-bold text-gray-800 mb-1">
              {documents.filter((d) => d.uploaded).length} of 3 documents
              uploaded
            </p>
            {documents.filter((d) => d.uploaded).length < 3 ? (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Please upload all documents to continue
              </p>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                ✓ All documents ready for submission
              </p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h4
                  className="text-blue-900 font-bold text-base sm:text-lg mb-3"
                  data-testid="verification-info-title"
                >
                  What happens next?
                </h4>
                <div className="space-y-2.5 text-sm sm:text-base text-blue-800">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="leading-relaxed">
                      Documents reviewed within 24-48 hours
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="leading-relaxed">
                      You'll receive notification once approved
                    </span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="leading-relaxed">
                      Start ordering fuel immediately after approval
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
