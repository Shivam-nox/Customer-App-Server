import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function CancellationRefundsScreen() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium">Cancellation & Refunds</h2>
      </div>

      <div className="p-4 pb-6">
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancellation & Refunds Policy</h1>
              
              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Order Cancellation</h2>
                  <p className="mb-4">
                    Orders can be cancelled before the fuel delivery truck is dispatched from our facility. 
                    Once the delivery is in transit, cancellation is not possible due to the nature of fuel delivery services.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Orders can be cancelled up to 2 hours before the scheduled delivery time</li>
                    <li>Cancellation requests must be made through the app or by calling customer support</li>
                    <li>No cancellation charges apply for orders cancelled within the allowed timeframe</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Policy</h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-medium">
                      <strong>No Refunds Policy:</strong> Due to the nature of fuel delivery services, 
                      we do not offer refunds once the fuel has been delivered and accepted by the customer.
                    </p>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Exceptions:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Quality issues with delivered fuel (subject to verification)</li>
                    <li>Delivery not made due to our operational issues</li>
                    <li>Incorrect quantity delivered (refund for the difference)</li>
                    <li>Technical errors in billing</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Process</h2>
                  <p className="mb-4">
                    In case of eligible refunds, the process will be as follows:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Refund requests must be raised within 24 hours of delivery</li>
                    <li>Our team will investigate the claim within 2-3 business days</li>
                    <li>Approved refunds will be processed within 5-7 business days</li>
                    <li>Refunds will be credited to the original payment method</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact for Cancellation/Refunds</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">
                      For cancellation or refund requests, please contact our customer support:
                    </p>
                    <ul className="mt-2 text-blue-800">
                      <li>Email: team@zapygo.com</li>
                      <li>Phone: +91 8800908227</li>
                      <li>Customer Support: Available 24/7</li>
                    </ul>
                  </div>
                </section>

                <section className="text-sm text-gray-600 border-t pt-4">
                  <p>Last updated: December 2024</p>
                  <p>This policy is subject to change without prior notice. Please check this page regularly for updates.</p>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}