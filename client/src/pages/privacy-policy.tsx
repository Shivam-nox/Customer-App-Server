import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyScreen() {
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
        <h2 className="text-lg font-medium">Privacy Policy</h2>
      </div>

      <div className="p-4 pb-6">
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
              
              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                  <p>
                    Zapygo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                    how we collect, use, disclose, and safeguard your information when you use our fuel delivery services 
                    and mobile application.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Name, email address, and phone number</li>
                    <li>Business name and address</li>
                    <li>GST number, PAN, and CIN details</li>
                    <li>Delivery addresses and location coordinates</li>
                    <li>Payment information (processed securely through payment gateways)</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">KYC Documents</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Business registration certificates</li>
                    <li>Tax identification documents</li>
                    <li>Identity verification documents</li>
                    <li>Business license and permits</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Order history and preferences</li>
                    <li>App usage patterns and interactions</li>
                    <li>Device information and IP address</li>
                    <li>Location data for delivery purposes</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Process and fulfill your fuel delivery orders</li>
                    <li>Verify your identity and business credentials</li>
                    <li>Communicate with you about orders and services</li>
                    <li>Process payments and maintain financial records</li>
                    <li>Improve our services and user experience</li>
                    <li>Comply with legal and regulatory requirements</li>
                    <li>Send promotional offers and updates (with your consent)</li>
                    <li>Provide customer support and resolve issues</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing and Disclosure</h2>
                  <p className="mb-4">We may share your information in the following circumstances:</p>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Service Providers</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Payment processing companies</li>
                    <li>Delivery partners and drivers</li>
                    <li>Cloud storage and hosting providers</li>
                    <li>Customer support services</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">Legal Requirements</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Compliance with applicable laws and regulations</li>
                    <li>Response to legal processes and government requests</li>
                    <li>Protection of our rights and property</li>
                    <li>Prevention of fraud and illegal activities</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
                  <p className="mb-4">We implement appropriate security measures to protect your information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Encryption of sensitive data in transit and at rest</li>
                    <li>Secure payment processing through certified gateways</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Employee training on data protection practices</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
                  <p className="mb-4">We retain your information for as long as necessary to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide our services to you</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes and enforce agreements</li>
                    <li>Maintain business records as required by law</li>
                  </ul>
                  <p className="mt-4">
                    KYC documents are retained as per regulatory requirements, typically for 7-10 years after 
                    account closure.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                  <p className="mb-4">You have the following rights regarding your personal information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and review your personal information</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Request deletion of your information (subject to legal requirements)</li>
                    <li>Opt-out of promotional communications</li>
                    <li>Request data portability</li>
                    <li>Withdraw consent where applicable</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking</h2>
                  <p className="mb-4">
                    We use cookies and similar technologies to enhance your experience:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Essential cookies for app functionality</li>
                    <li>Analytics cookies to understand usage patterns</li>
                    <li>Preference cookies to remember your settings</li>
                    <li>Marketing cookies for personalized content (with consent)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Third-Party Services</h2>
                  <p className="mb-4">
                    Our app may contain links to third-party services. We are not responsible for the privacy 
                    practices of these external services. We encourage you to review their privacy policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
                  <p>
                    Our services are not intended for individuals under 18 years of age. We do not knowingly 
                    collect personal information from children under 18.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">11. International Data Transfers</h2>
                  <p>
                    Your information is primarily stored and processed in India. If we transfer data internationally, 
                    we ensure appropriate safeguards are in place to protect your information.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes 
                    through the app or via email. Your continued use of our services constitutes acceptance of the 
                    updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 mb-2">For privacy-related questions or requests:</p>
                    <ul className="text-blue-800 space-y-1">
                      <li><strong>Email:</strong> team@zapygo.com</li>
                      <li><strong>Phone:</strong> +91 8800908227</li>
                      
                      <li><strong>Address:</strong> Om Chambers, 648/A, 4th Floor, Binnamangala 1st Stage, Indiranagar, Bangalore  560038 </li>
                      <li><strong>Data Protection Officer:</strong> Available during business hours</li>
                    </ul>
                  </div>
                </section>

                <section className="text-sm text-gray-600 border-t pt-4">
                  <p><strong>Last updated:</strong> December 2024</p>
                  <p>This Privacy Policy is governed by Indian data protection laws and regulations.</p>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}