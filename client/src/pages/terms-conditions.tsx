import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TermsConditionsScreen() {
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
        <h2 className="text-lg font-medium">Terms and Conditions</h2>
      </div>

      <div className="p-4 pb-6">
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Terms and Conditions</h1>
              
              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                  <p>
                    By accessing and using Zapygo's fuel delivery services, you accept and agree to be bound by the terms 
                    and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
                  <p className="mb-4">
                    Zapygo provides doorstep diesel fuel delivery services to businesses and commercial establishments 
                    in Bangalore, Karnataka. Our services include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>On-demand diesel fuel delivery</li>
                    <li>Scheduled fuel delivery services</li>
                    <li>Real-time order tracking</li>
                    <li>Digital payment processing</li>
                    <li>Customer support services</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility and Registration</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Services are available only to registered businesses with valid licenses</li>
                    <li>Users must be 18 years or older</li>
                    <li>Valid KYC documents are required for service activation</li>
                    <li>Services are currently available only in Bangalore, Karnataka</li>
                    <li>We reserve the right to refuse service to any customer</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Ordering and Delivery</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Minimum order quantity: 100 liters</li>
                    <li>Maximum order quantity: 10,000 liters</li>
                    <li>Delivery charges apply as per current rate card</li>
                    <li>Delivery times are estimates and may vary due to traffic and weather conditions</li>
                    <li>Customer must be present at delivery location for fuel transfer</li>
                    <li>Proper storage facilities must be available at delivery location</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payment Terms</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Payment must be made before or upon delivery</li>
                    <li>We accept UPI, cards, net banking, and cash on delivery</li>
                    <li>All prices include applicable taxes</li>
                    <li>Prices are subject to change without prior notice</li>
                    <li>Failed payments may result in service suspension</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Quality and Safety</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We ensure fuel quality meets Indian standards (IS 1460:2020)</li>
                    <li>All safety protocols are followed during delivery</li>
                    <li>Customer is responsible for safe storage post-delivery</li>
                    <li>Any quality issues must be reported within 24 hours</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Liability and Disclaimers</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Zapygo's liability is limited to the value of fuel delivered</li>
                    <li>We are not liable for any consequential or indirect damages</li>
                    <li>Customer assumes responsibility for fuel storage and usage</li>
                    <li>Force majeure events may affect service delivery</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Privacy and Data Protection</h2>
                  <p>
                    Your privacy is important to us. Please refer to our Privacy Policy for information on how we 
                    collect, use, and protect your personal data.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
                  <p>
                    We reserve the right to terminate or suspend your account and access to our services at our sole 
                    discretion, without notice, for conduct that we believe violates these Terms or is harmful to 
                    other users, us, or third parties.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Governing Law</h2>
                  <p>
                    These terms shall be governed by and construed in accordance with the laws of India. 
                    Any disputes shall be subject to the jurisdiction of courts in Bangalore, Karnataka.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 mb-2">For any questions regarding these terms:</p>
                    <ul className="text-blue-800 space-y-1">
                      <li>Email: team@zapygo.com</li>
                      <li>Phone: +91 8800908227</li>
                      <li>Om Chambers, 648/A, 4th Floor, Binnamangala 1st Stage, Indiranagar, Bangalore 560038 </li>
                    </ul>
                  </div>
                </section>

                <section className="text-sm text-gray-600 border-t pt-4">
                  <p>Last updated: December 2024</p>
                  <p>These terms are subject to change. Continued use of our services constitutes acceptance of any modifications.</p>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}