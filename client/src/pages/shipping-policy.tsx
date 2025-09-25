import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ShippingPolicyScreen() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center p-4 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/profile")}
          className="mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium">Delivery Policy</h2>
      </div>

      <div className="p-4 pb-6">
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Delivery Policy</h1>
              
              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Service Area</h2>
                  <p className="mb-4">
                    Zapygo currently provides doorstep diesel delivery services within Bangalore city limits, Karnataka. 
                    We cover all areas with pincode starting with 5XXXXX.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-medium">Coverage Areas Include:</p>
                    <ul className="mt-2 text-blue-800 list-disc pl-6">
                      <li>HSR Layout, Koramangala, BTM Layout</li>
                      <li>Electronic City, Bommanahalli, JP Nagar</li>
                      <li>Whitefield, Marathahalli, Sarjapur Road</li>
                      <li>Indiranagar, Domlur, Old Airport Road</li>
                      <li>Hebbal, RT Nagar, Yelahanka</li>
                      <li>And all other areas within Bangalore city limits</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Schedule</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-2">Available Time Slots</h3>
                      <ul className="text-green-700 space-y-1">
                        <li>9:00 AM - 11:00 AM</li>
                        <li>11:00 AM - 1:00 PM</li>
                        <li>1:00 PM - 3:00 PM</li>
                        <li>3:00 PM - 5:00 PM</li>
                        <li>5:00 PM - 7:00 PM</li>
                        <li>7:00 PM - 9:00 PM</li>
                      </ul>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-medium text-orange-800 mb-2">Operating Days</h3>
                      <ul className="text-orange-700 space-y-1">
                        <li>Monday - Friday: All slots available</li>
                        <li>Saturday: 9:00 AM - 1:00 PM only</li>
                        <li>Sunday: Closed</li>
                        <li>Public Holidays: Limited service</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Order Requirements</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Minimum Order</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>100 liters minimum per order</li>
                        <li>Suitable for small businesses and generators</li>
                        <li>Same delivery charges apply</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Maximum Order</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>10,000 liters maximum per order</li>
                        <li>Suitable for large industrial requirements</li>
                        <li>May require special tanker arrangements</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Process</h2>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Order Confirmation</h4>
                        <p className="text-gray-600">Order confirmed after payment and KYC verification</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Driver Assignment</h4>
                        <p className="text-gray-600">Qualified driver assigned with fuel tanker</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Real-time Tracking</h4>
                        <p className="text-gray-600">Track your delivery in real-time through the app</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Safe Delivery</h4>
                        <p className="text-gray-600">Fuel delivered safely to your specified location</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Requirements</h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Customer Responsibilities:</h3>
                    <ul className="text-yellow-700 list-disc pl-6 space-y-1">
                      <li>Ensure proper storage tank/container is available</li>
                      <li>Provide clear access for delivery vehicle</li>
                      <li>Be present during delivery for verification</li>
                      <li>Have valid ID proof ready for verification</li>
                      <li>Ensure safe environment for fuel transfer</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Charges</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      <li><strong>Standard Delivery:</strong> ₹300 per order</li>
                      <li><strong>GST:</strong> 18% on delivery charges</li>
                      <li><strong>Emergency Delivery:</strong> Additional charges may apply</li>
                      <li><strong>Remote Areas:</strong> Additional charges for areas beyond 25km from city center</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Delays</h2>
                  <p className="mb-4">
                    While we strive to deliver within the scheduled time slot, delays may occur due to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Heavy traffic conditions</li>
                    <li>Weather conditions</li>
                    <li>Vehicle breakdown or technical issues</li>
                    <li>Customer unavailability</li>
                    <li>Regulatory restrictions</li>
                  </ul>
                  <p className="mt-4">
                    In case of delays, customers will be notified via SMS and app notifications.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact for Delivery Support</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 mb-2">For delivery-related queries:</p>
                    <ul className="text-blue-800 space-y-1">
                      <li>Email: team@zapygo.com</li>
                      <li>Phone: +91 8800908227</li>
                      <li>Customer Support: Available 24/7</li>
                      <li>Emergency Support: Available during delivery hours</li>
                    </ul>
                  </div>
                </section>

                <section className="text-sm text-gray-600 border-t pt-4">
                  <p>Last updated: December 2024</p>
                  <p>This policy is subject to change based on operational requirements and regulatory guidelines.</p>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}