import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Headphones,
} from "lucide-react";

export default function ContactUsScreen() {
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
        <h2 className="text-lg font-medium">Contact Us</h2>
      </div>

      <div className="p-4 pb-6">
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Get in Touch</h1>
              <p className="text-blue-100">
                We're here to help with all your fuel delivery needs
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid gap-4">
            {/* Email */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600">team@zapygo.com</p>
                    <p className="text-sm text-gray-500">
                      We'll respond within 24 hours
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("mailto:team@zapygo.com")}
                  >
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="text-green-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Phone Number
                    </h3>
                    <p className="text-gray-600">+91 8800908227</p>
                    <p className="text-sm text-gray-500">
                      Call us for immediate assistance
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("tel:+918800908227")}
                  >
                    Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer Support */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Headphones className="text-purple-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Customer Support
                    </h3>
                    <p className="text-gray-600">24/7 Support Available</p>
                    <p className="text-sm text-gray-500">
                      Round-the-clock assistance for emergencies
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-500 rounded-full inline-block"></div>
                    <span className="text-sm text-green-600 ml-2">Online</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Office Address */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-orange-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Office Address
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {" "}
                    Om Chambers, 648/A, 4th Floor, Binnamangala
                    <br />
                    7th Sector HSR Layout
                    <br />
                    1st Stage, Indiranagar, Bangalore 560038 <br />
                    India
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      window.open(
                        "https://maps.google.com/?q=HSR+Layout+Bengaluru+Karnataka+560102"
                      )
                    }
                  >
                    View on Map
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Working Hours
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Monday - Friday</span>
                      <span className="font-medium text-gray-900">
                        9:00 AM - 6:00 PM
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Saturday</span>
                      <span className="font-medium text-gray-900">
                        9:00 AM - 1:00 PM
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Sunday</span>
                      <span className="font-medium text-red-600">Closed</span>
                    </div>
                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600">Customer Support</span>
                        <span className="font-medium text-green-600">24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center space-y-1"
                  onClick={() => setLocation("/new-order")}
                >
                  <span className="text-sm font-medium">Place Order</span>
                  <span className="text-xs text-gray-500">Order fuel now</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center space-y-1"
                  onClick={() => setLocation("/track-order")}
                >
                  <span className="text-sm font-medium">Track Order</span>
                  <span className="text-xs text-gray-500">Check status</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-semibold text-red-800 mb-2">
                  Emergency Contact
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  For urgent delivery issues or emergencies during delivery
                </p>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => window.open("tel:+918800908227")}
                >
                  <Phone size={16} className="mr-2" />
                  Call Emergency Line
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
