import React, { useEffect } from "react";
import {
  Shield,
  Award,
  Heart,
  Users,
  Target,
  Globe,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { t } from "../../i18n";
import { MultiParagraphText } from "../../components/common/MultiParagraphText";
import { useNavigationState } from "../../contexts/NavigationContext";

export const AboutPage: React.FC = () => {
  const { endNavigation } = useNavigationState();
  useEffect(() => {
    // Static page: end navigation immediately after mount
    endNavigation();
  }, [endNavigation]);
  return (
    <div className="bg-sky-50">
      <div
        className="text-white py-16"
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("about_title")}
          </h1>
          <p className="text-xl text-cyan-100">{t("about_subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-20">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12 lg:p-14 w-full">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8 tracking-tight">
              {t("our_story")}
            </h2>
            <MultiParagraphText
              mainKey="story_text"
              fallbackKeys={["story_p1", "story_p2", "story_p3"]}
              className="prose prose-base md:prose-lg max-w-none text-gray-700 space-y-5"
            />
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t("why_choose_us")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-[#0891b2]" />,
                title: t("safe_secure"),
                description: t("safe_secure_desc"),
              },
              {
                icon: <Award className="h-12 w-12 text-[#0891b2]" />,
                title: t("award_winning"),
                description: t("award_winning_desc"),
              },
              {
                icon: <Heart className="h-12 w-12 text-[#0891b2]" />,
                title: t("personalized_exp"),
                description: t("personalized_exp_desc"),
              },
              {
                icon: <Users className="h-12 w-12 text-[#0891b2]" />,
                title: t("expert_guides"),
                description: t("expert_guides_desc"),
              },
              {
                icon: <Globe className="h-12 w-12 text-[#0891b2]" />,
                title: t("sustainable_tourism"),
                description: t("sustainable_tourism_desc"),
              },
              {
                icon: <TrendingUp className="h-12 w-12 text-[#0891b2]" />,
                title: t("best_value"),
                description: t("best_value_desc"),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {t("our_values")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="h-8 w-8 text-[#0891b2]" />,
                  title: t("excellence"),
                  description: t("excellence_desc"),
                },
                {
                  icon: <Heart className="h-8 w-8 text-[#0891b2]" />,
                  title: t("passion"),
                  description: t("passion_desc"),
                },
                {
                  icon: <Shield className="h-8 w-8 text-[#0891b2]" />,
                  title: t("integrity"),
                  description: t("integrity_desc"),
                },
              ].map((value, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t("by_the_numbers")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "10+", label: t("years_experience") },
              { number: "18,000+", label: t("happy_travelers") },
              { number: "50+", label: t("destinations") },
              { number: "98%", label: t("satisfaction_rate") },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white rounded-lg shadow-md p-6"
              >
                <p className="text-4xl font-bold text-[#0891b2] mb-2">
                  {stat.number}
                </p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {t("our_commitment")}
          </h2>
          <div className="space-y-4">
            {[
              t("commit_1"),
              t("commit_2"),
              t("commit_3"),
              t("commit_4"),
              t("commit_5"),
              t("commit_6"),
            ].map((commitment, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{commitment}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-lg shadow-xl p-12 text-center text-white"
          style={{
            background: "linear-gradient(135deg, #0c4a6e 0%, #065f46 100%)",
          }}
        >
          <h2 className="text-3xl font-bold mb-4">{t("cta_title")}</h2>
          <p className="text-xl mb-8 text-cyan-100">{t("cta_subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/packages">
              <Button
                size="lg"
                variant="outline"
                className="bg-[#0891b2] text-white hover:bg-cyan-700"
              >
                {t("explore_packages")}
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#0891b2]"
              >
                {t("contact_us")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
