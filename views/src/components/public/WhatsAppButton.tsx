import React from "react";
import { MessageCircle } from "lucide-react";
import { currentLang } from "../../i18n";

export const WhatsAppButton: React.FC = () => {
  const whatsappNumber =
    import.meta.env.VITE_WHATSAPP_NUMBER || "6285283918338";
  const defaultMessage =
    currentLang() === "zh"
      ? "你好！我对你们的旅行套餐感兴趣。"
      : "Hello! I am interested in your travel packages.";

  const handleClick = () => {
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`,
      "_blank",
    );
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300 animate-bounce"
      aria-label={
        currentLang() === "zh" ? "通过微信联系我们" : "Contact us on WhatsApp"
      }
      type="button"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};
