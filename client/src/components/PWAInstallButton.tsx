import { useState, useEffect } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowDialog(true);
      return;
    }

    if (!deferredPrompt) {
      // No install prompt available, show manual instructions
      setShowDialog(true);
      return;
    }

    // Trigger install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA installed");
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  // Don't show button if already installed
  if (isInstalled) return null;

  // Show button if:
  // 1. iOS (always show, since we need to provide manual instructions)
  // 2. Android with install prompt available
  // Note: On Android without prompt, button won't show (likely already installed or criteria not met)
  const showButton = isIOS || deferredPrompt;

  if (!showButton) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstallClick}
        className="hover:bg-blue-600/20 p-2"
        title="Install App"
      >
        <Download size={20} />
      </Button>

      {/* iOS Instructions Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="text-blue-600" size={24} />
              Install Zapygo App
            </DialogTitle>
          </DialogHeader>

          {isIOS ? (
            <div className="space-y-4">
              <DialogDescription className="text-base">
                Install this app on your iPhone for quick access and a better
                experience:
              </DialogDescription>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Tap the <Share size={16} className="inline mx-1" />{" "}
                      <strong>Share</strong> button at the bottom of Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Tap <strong>"Add"</strong> in the top right corner
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✨ The Zapygo app will appear on your home screen like any
                  other app!
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Note: This only works in Safari browser
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <DialogDescription className="text-base">
                Install Zapygo app for quick access:
              </DialogDescription>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Tap the <strong>menu (⋮)</strong> in your browser
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Select <strong>"Add to Home screen"</strong> or{" "}
                      <strong>"Install app"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Tap <strong>"Install"</strong> or <strong>"Add"</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✨ Access Zapygo instantly from your home screen!
                </p>
              </div>
            </div>
          )}

          <Button onClick={() => setShowDialog(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
