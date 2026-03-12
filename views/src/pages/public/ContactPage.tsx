import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import { contactApi } from "../../services/api";
import {
  validateEmail,
  validatePhone,
  sanitizeInput,
} from "../../utils/security";
import { Input, Textarea } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { useToast } from "../../contexts/ToastContext";
import { t } from "../../i18n";
import { useNavigationState } from "../../contexts/NavigationContext";

export const ContactPage: React.FC = () => {
  const { endNavigation } = useNavigationState();
  useEffect(() => {
    endNavigation();
  }, [endNavigation]);
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("full_name") + " " + "is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = t("email_address") + " " + "is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid " + t("email_address");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("phone_number") + " " + "is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Invalid " + t("phone_number");
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t("subject") + " " + "is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = t("message") + " " + "is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        subject: sanitizeInput(formData.subject),
        message: sanitizeInput(formData.message),
      };

      await contactApi.send(sanitizedData);
      addToast(t("send_message") + " success!", "success");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      addToast("Failed to " + t("send_message"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-sky-50">
      <div
        className="text-white py-12"
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {t("contact_us")}
              </h1>
              <p className="text-lg text-cyan-100">
                {t("contact_page_subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t("send_us_message")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t("full_name")}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="John Doe"
                    required
                  />
                  <Input
                    label={t("email_address")}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t("phone_number")}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="+62-852-8391-8338"
                    required
                  />
                  <Input
                    label={t("subject")}
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    error={errors.subject}
                    placeholder="Package inquiry"
                    required
                  />
                </div>

                <Textarea
                  label={t("message")}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  error={errors.message}
                  placeholder="Tell us about your travel plans..."
                  rows={6}
                  required
                />

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full md:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t("send_message")}
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t("contact_information")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t("address")}
                    </p>
                    <p className="text-gray-600 text-sm">Bintan - Indonesia</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{t("phone")}</p>
                    <a
                      href="tel:+6285283918338"
                      className="text-[#0891b2] hover:underline text-sm"
                    >
                      +62-852-8391-8338
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{t("email")}</p>
                    <a
                      href="mailto:info@besttravel.com"
                      className="text-[#0891b2] hover:underline text-sm"
                    >
                      info@besttravel.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-[#0891b2] flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t("business_hours")}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Monday - Friday: 9:00 AM - 6:00 PM
                      <br />
                      Saturday: 9:00 AM - 4:00 PM
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg shadow-md p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-green-600" />
                {t("quick_contact")}
              </h3>
              <p className="text-gray-700 mb-4">{t("quick_contact_desc")}</p>
              <a
                href="https://wa.me/6285283918338?text=Hello! I would like to inquire about travel packages."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors w-full justify-center"
              >
                <MessageCircle className="h-5 w-5" />
                {t("chat_on_whatsapp")}
              </a>
            </div>

            {/* <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('visit_our_office')}</h3>
              <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.7687!2d116.0400!3d-8.4800!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMjgnNDguMCJTIDExNsKwMDInMjQuMCJF!5e0!3m2!1sen!2sid!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};
