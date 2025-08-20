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
import { ArrowLeft, Shield, CheckCircle, Upload, FileText, CreditCard, Award } from "lucide-react";
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

  const handleUploadComplete = (docType: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileUrl = uploadedFile.uploadURL;
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.type === docType 
            ? { ...doc, uploaded: true, url: fileUrl }
            : doc
        )
      );

      toast({
        title: "Upload Successful",
        description: `${documents.find(d => d.type === docType)?.name} uploaded successfully`,
      });
    }
  };

  const handleSubmitKyc = async () => {
    const uploadedDocs = documents.filter(doc => doc.uploaded);
    
    if (uploadedDocs.length < 3) {
      toast({
        title: "Incomplete Documents",
        description: "Please upload all required documents",
        variant: "destructive",
      });
      return;
    }

    const docUrls: Record<string, string> = {};
    uploadedDocs.forEach(doc => {
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
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="kyc-upload-screen">
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
        <h2 className="text-lg font-medium" data-testid="page-title">Complete KYC</h2>
      </div>

      <div className="flex-1 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="text-orange-600" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2" data-testid="verify-title">Verify Your Business</h3>
          <p className="text-gray-600" data-testid="verify-description">Upload required documents to complete verification</p>
        </div>

        <div className="space-y-4 mb-6">
          {documents.map((doc) => (
            <Card key={doc.type} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600">{doc.icon}</div>
                    <div>
                      <h4 className="font-medium" data-testid={`${doc.type}-title`}>{doc.name}</h4>
                      <p className="text-sm text-gray-600" data-testid={`${doc.type}-description`}>{doc.description}</p>
                    </div>
                  </div>
                  {doc.uploaded ? (
                    <CheckCircle className="text-green-500" size={24} data-testid={`${doc.type}-success`} />
                  ) : (
                    <Upload className="text-gray-400" size={24} />
                  )}
                </div>

                {!doc.uploaded ? (
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete(doc.type)}
                    buttonClassName="w-full bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-3" data-testid={`${doc.type}-upload-button`}>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="text-blue-600" size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-gray-700">Click to upload {doc.name}</p>
                        <p className="text-sm text-gray-500">PDF or Image (Max 5MB)</p>
                      </div>
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                      </div>
                    </div>
                  </ObjectUploader>
                ) : (
                  <div className="w-full bg-green-50 border border-green-300 rounded-lg p-4 text-center">
                    <CheckCircle className="text-green-500 mb-2 mx-auto" size={24} />
                    <p className="text-sm text-green-600 font-medium">Document uploaded successfully</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={handleSubmitKyc}
          className="w-full ripple mb-4"
          disabled={updateKycMutation.isPending || documents.filter(d => d.uploaded).length < 3}
          data-testid="submit-kyc-button"
        >
          {updateKycMutation.isPending ? <LoadingSpinner /> : "Submit for Verification"}
        </Button>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-blue-800 font-medium" data-testid="verification-info-title">Verification Process</p>
                <p className="text-xs text-blue-700 mt-1" data-testid="verification-info-description">
                  Documents will be reviewed within 24-48 hours. You'll receive notification once approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
