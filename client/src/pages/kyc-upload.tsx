import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react"; // Only for user ID
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Search, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from "lucide-react";

type ViewState = 'selection' | 'register_check' | 'register_form' | 'join_code';

export default function KycUploadScreen() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  
  // --- STATE ---
  const [view, setView] = useState<ViewState>('selection');
  
  // Form Data
  const [gstNumber, setGstNumber] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // API State (derived from check)
  const [existingOrg, setExistingOrg] = useState<{ id: number, name: string } | null>(null);

  // --- API MUTATIONS ---

  // 1. Check GST (Flow 2.1.1.1.1.1)
  const checkGstMutation = useMutation({
    mutationFn: async (gst: string) => {
      const res = await fetch("/api/kyb/check-gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstNumber: gst }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.exists) {
        // GST Exists -> Show "Request to Join" UI
        setExistingOrg({ id: data.orgId, name: data.orgName });
        toast({
          title: "Organization Found",
          description: `This GST is already registered to ${data.orgName}.`,
        });
      } else {
        // GST New -> Show "Create Form" UI
        setExistingOrg(null);
        setView('register_form');
      }
    }
  });

  // 2. Submit New Org (Flow 2.1.1.1.1.1.1)
  const submitOrgMutation = useMutation({
    mutationFn: async () => {
      // In real app, upload file first, get URL, then send URL
      const res = await fetch("/api/custom-org/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          gstNumber,
          name: orgName,
          documents: ["mock_url_to_document.pdf"] // Replace with actual file URL
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Organization created. Verification pending." });
      setLocation("/home");
    }
  });

  // 3. Join via Existing GST Match (Flow 2.1.1.1.1.2)
  const joinRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/custom-org/submit", { // Re-using submit endpoint which handles join logic
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          gstNumber, // Backend checks this and triggers 'request_sent'
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Request Sent", description: data.message });
      setLocation("/home");
    }
  });

  // 4. Join via Code (Flow 2.1.1.2)
  const joinByCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/custom-org/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          orgCode
        }),
      });
      if (!res.ok) throw new Error("Invalid Code");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request Sent", description: "Admins have been notified." });
      setLocation("/home");
    },
    onError: () => {
      toast({ title: "Error", description: "Invalid Organization Code", variant: "destructive" });
    }
  });

  // --- RENDER HELPERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => view === 'selection' ? setLocation("/home") : setView('selection')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Business Verification</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto mt-4">

        {/* VIEW 1: SELECTION (Create vs Join) */}
        {view === 'selection' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900">Setup your Profile</h2>
              <p className="text-gray-500 text-sm mt-2">Are you registering a new company or joining an existing team?</p>
            </div>

            {/* Register New (Submit Details) */}
            <button 
              onClick={() => setView('register_check')}
              className="w-full bg-white p-6 rounded-2xl border-2 border-transparent hover:border-red-100 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 group"
            >
              <div className="bg-red-50 p-3 rounded-xl group-hover:bg-red-100 transition-colors">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Submit Organization Details</h3>
                <p className="text-sm text-gray-500 mt-1">I have a GST number and documents.</p>
              </div>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold tracking-widest">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Join Existing (Enter Code) */}
            <button 
              onClick={() => setView('join_code')}
              className="w-full bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-100 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 group"
            >
              <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Enter Organization Code</h3>
                <p className="text-sm text-gray-500 mt-1">I have a 6-digit code from my admin.</p>
              </div>
            </button>
          </div>
        )}

        {/* VIEW 2A: GST CHECK */}
        {view === 'register_check' && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Verify GST</CardTitle>
              <CardDescription>Enter your GST number to check eligibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>GST Number</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. 29AAAAA0000A1Z5" 
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    maxLength={15}
                  />
                  <Button 
                    onClick={() => checkGstMutation.mutate(gstNumber)} 
                    disabled={gstNumber.length !== 15 || checkGstMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white min-w-[80px]"
                  >
                    {checkGstMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* If GST Exists -> Show Join Prompt */}
              {existingOrg && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-orange-900 text-sm">Organization Exists</h4>
                      <p className="text-xs text-orange-800 mt-1 mb-3">
                        The GST <strong>{gstNumber}</strong> is already registered to <strong>{existingOrg.name}</strong>.
                      </p>
                      <Button 
                        onClick={() => joinRequestMutation.mutate()}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
                        disabled={joinRequestMutation.isPending}
                      >
                        {joinRequestMutation.isPending ? "Sending..." : "Request to Join Team"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* VIEW 2B: REGISTER FORM (If GST is New) */}
        {view === 'register_form' && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>GST verified. Please complete your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input 
                  placeholder="Enter company name" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Label className="mb-2 block">Upload GST Certificate</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50 relative">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.jpg,.png"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">
                    {file ? file.name : "Click to upload document"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                </div>
              </div>

              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
                onClick={() => submitOrgMutation.mutate()}
                disabled={!orgName || !file || submitOrgMutation.isPending}
              >
                {submitOrgMutation.isPending ? "Creating..." : "Submit for Verification"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* VIEW 3: JOIN BY CODE */}
        {view === 'join_code' && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Join via Code</CardTitle>
              <CardDescription>Enter the 6-character code shared by your admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Code</Label>
                <div className="flex justify-center">
                  <Input 
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14 uppercase" 
                    placeholder="XXXXXX" 
                    maxLength={6}
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>Your request will be sent to the organization admins for approval. You will receive a notification once approved.</p>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={orgCode.length < 6 || joinByCodeMutation.isPending}
                onClick={() => joinByCodeMutation.mutate()}
              >
                {joinByCodeMutation.isPending ? "Sending Request..." : "Send Join Request"}
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}