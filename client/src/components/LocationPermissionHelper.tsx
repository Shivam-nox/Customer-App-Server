import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, Settings } from "lucide-react";

interface LocationPermissionHelperProps {
  onPermissionGranted?: () => void;
}

export default function LocationPermissionHelper({ onPermissionGranted }: LocationPermissionHelperProps) {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionState(permission.state);
      
      permission.addEventListener('change', () => {
        setPermissionState(permission.state);
        if (permission.state === 'granted' && onPermissionGranted) {
          onPermissionGranted();
        }
      });
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  const requestLocationPermission = async () => {
    setIsChecking(true);
    
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
        });
      });
      
      setPermissionState('granted');
      if (onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (error) {
      setPermissionState('denied');
    } finally {
      setIsChecking(false);
    }
  };

  if (permissionState === 'granted') {
    return null;
  }

  if (permissionState === 'denied') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">
                Location Access Blocked
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Location permissions are blocked. To use location detection:
              </p>
              <ol className="text-sm text-red-700 space-y-1 mb-3 ml-4">
                <li>1. Click the location icon in your browser's address bar</li>
                <li>2. Select "Allow" for location access</li>
                <li>3. Refresh the page and try again</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-white hover:bg-red-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permissionState === 'prompt' || permissionState === null) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 mb-1">
                Enable Location Access
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                Allow location access to automatically detect and fill your address details.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={requestLocationPermission}
                disabled={isChecking}
                className="bg-white hover:bg-blue-50"
              >
                {isChecking ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Allow Location Access
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}