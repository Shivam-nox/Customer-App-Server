import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import AddressManager from "@/components/AddressManager";
import { ArrowLeft } from "lucide-react";

export default function AddressesScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      data-testid="addresses-screen"
    >
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center">
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
            My Addresses
          </h2>
        </div>

      </div>

      <div className="flex-1 p-4">
        <AddressManager 
          onSelectAddress={(address) => {
            setSelectedAddress(address);
            toast({
              title: "Address Selected",
              description: `Selected ${address.label} address`,
            });
          }}
          selectedAddressId={selectedAddress?.id}
        />
      </div>
    </div>
  );
}
