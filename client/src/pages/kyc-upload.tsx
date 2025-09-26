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
      result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    ) => {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const fileUrl = uploadedFile.uploadURL;

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.type === docType
              ? { ...doc, uploaded: true, url: fileUrl }
              : doc,
          ),
        );

        toast({
          title: "Upload Successful",
          description: `${documents.find((d) => d.type === docType)?.name} uploaded successfully`,
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
    <div
      className="min-h-screen bg-gray-50"
      data-testid="kyc-upload-screen"
    >
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/home")}
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="text-white" size={36} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2" data-testid="verify-title">
            Verify Your Business
          </h3>
          <p className="text-gray-600 text-lg" data-testid="verify-description">
            Upload required documents to complete verification
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-6 mb-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Upload Documents</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-400">Review</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-400">Approved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Cards */}
        <div className="space-y-6 mb-8">
          {documents.map((doc, index) => (
            <Card key={doc.type} className={`border-2 transition-all duration-200 ${
              doc.uploaded 
                ? 'border-green-200 bg-green-50/30 shadow-sm' 
                : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
            }`}>
              <CardContent className="p-6">
                {/* Document Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      doc.uploaded 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {doc.uploaded ? <CheckCircle size={24} /> : doc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base mb-1" data-testid={`${doc.type}-title`}>
                        {doc.name}
                      </h4>
                      <p className="text-gray-600 text-sm" data-testid={`${doc.type}-description`}>
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ml-3 ${
                    doc.uploaded 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {doc.uploaded ? 'Uploaded' : `${index + 1} of 3`}
                  </div>
                </div>

                {/* Upload Area */}
                {!doc.uploaded ? (
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete(doc.type)}
                    buttonClassName="w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-8 px-6 text-center hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center space-y-3" data-testid={`${doc.type}-upload-button`}>
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <Upload className="text-blue-600 group-hover:text-blue-700" size={24} />
                      </div>
                      <div className="text-center space-y-1">
                        <h6 className="text-base font-medium text-gray-800">
                          Click to upload {doc.name}
                        </h6>
                        <p className="text-xs text-gray-500 pb-2">
                          PDF, JPG, PNG • Max 5MB
                        </p>
                      </div>
                    </div>
                  </ObjectUploader>
                ) : (
                  <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircle className="text-green-500" size={24} />
                      <div>
                        <p className="text-green-700 font-medium text-sm">Document uploaded successfully</p>
                        <p className="text-green-600 text-xs">Ready for verification</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="space-y-4">
          <Button
            onClick={handleSubmitKyc}
            className={`w-full h-14 text-lg font-semibold ripple transition-all duration-200 ${
              documents.filter((d) => d.uploaded).length === 3
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={
              updateKycMutation.isPending ||
              documents.filter((d) => d.uploaded).length < 3
            }
            data-testid="submit-kyc-button"
          >
            {updateKycMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Shield size={20} />
                <span>Submit for Verification</span>
              </div>
            )}
          </Button>

          {/* Progress Summary */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {documents.filter((d) => d.uploaded).length} of 3 documents uploaded
            </p>
            {documents.filter((d) => d.uploaded).length < 3 && (
              <p className="text-xs text-orange-600 mt-1">
                Please upload all documents to continue
              </p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="text-blue-900 font-semibold mb-2" data-testid="verification-info-title">
                  What happens next?
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Documents reviewed within 24-48 hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>You'll receive notification once approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Start ordering fuel immediately after approval</span>
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
